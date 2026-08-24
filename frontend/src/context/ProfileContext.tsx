import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getApplicant } from "../api/client";
import type { Applicant } from "../types";

const STORAGE_KEY = "applicantId";

interface ProfileContextValue {
  applicant: Applicant | null;
  loading: boolean;
  error: string | null;
  setApplicant: (applicant: Applicant) => void;
  clearProfile: () => void;
  refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [applicant, setApplicantState] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setApplicantState(null);
      setLoading(false);
      return;
    }
    try {
      const res = await getApplicant(storedId);
      setApplicantState(res.applicant);
      setError(null);
    } catch (err) {
      // Stored id no longer resolves (e.g. deleted, or a different DB) — fall back to onboarding.
      localStorage.removeItem(STORAGE_KEY);
      setApplicantState(null);
      setError(err instanceof Error ? err.message : "Could not load business profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setApplicant(next: Applicant) {
    localStorage.setItem(STORAGE_KEY, next.id);
    setApplicantState(next);
  }

  function clearProfile() {
    localStorage.removeItem(STORAGE_KEY);
    setApplicantState(null);
  }

  return (
    <ProfileContext.Provider value={{ applicant, loading, error, setApplicant, clearProfile, refresh: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within a ProfileProvider");
  return ctx;
}
