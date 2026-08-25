import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./en";
import hi from "./hi";

export type LanguageCode = "en" | "hi";

const DICTIONARIES: Record<LanguageCode, typeof en> = { en, hi };
const STORAGE_KEY = "language";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "hi" ? "hi" : "en";
  });

  function setLanguage(lang: LanguageCode) {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }

  const t = useMemo(() => {
    return (path: string): string => {
      const value = getByPath(DICTIONARIES[language], path);
      if (typeof value === "string") return value;
      // Fall back to English, then to the raw key, rather than rendering "undefined".
      const fallback = getByPath(DICTIONARIES.en, path);
      return typeof fallback === "string" ? fallback : path;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within a LanguageProvider");
  return ctx;
}
