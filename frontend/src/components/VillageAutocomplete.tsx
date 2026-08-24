import { useEffect, useRef, useState } from "react";
import { searchLocations } from "../api/client";
import type { LocationSuggestion } from "../types";

interface Props {
  value: string;
  onChange: (value: string, confirmed: boolean) => void;
}

// Business profiles require an exact village (applicants.village_code is NOT NULL and FKs
// to villages.lgd_code) — block/district level isn't specific enough. This filters
// suggestions down to village-level only and tracks whether the current text exactly
// matches a suggestion the user clicked, so the form can block submission otherwise.
export function VillageAutocomplete({ value, onChange }: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const result = await searchLocations(value);
        setSuggestions(result.suggestions.filter((s) => s.level === "village"));
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [value]);

  return (
    <div className="autocomplete">
      <label htmlFor="villageName">Village</label>
      <input
        id="villageName"
        type="text"
        value={value}
        placeholder="Start typing a village name..."
        onChange={(e) => {
          onChange(e.target.value, false);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      <p className="field-hint">Pick a village from the list — free text won't be accepted.</p>
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((s, i) => (
            <li
              key={`${s.code}-${i}`}
              onMouseDown={() => {
                onChange(s.name, true);
                setOpen(false);
              }}
            >
              <span className="autocomplete-name">{s.name}</span>
              <span className="autocomplete-path">{s.path}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
