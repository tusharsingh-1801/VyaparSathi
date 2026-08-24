import { useEffect, useRef, useState } from "react";
import { searchLocations } from "../api/client";
import type { LocationSuggestion } from "../types";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LocationAutocomplete({ value, onChange }: Props) {
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
        setSuggestions(result.suggestions);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [value]);

  return (
    <div className="autocomplete">
      <label htmlFor="location">Location (village, block, or district)</label>
      <input
        id="location"
        type="text"
        value={value}
        placeholder="e.g. Rae Bareli, Para, Harchandpur"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="autocomplete-list">
          {suggestions.map((s, i) => (
            <li
              key={`${s.level}-${s.name}-${i}`}
              onMouseDown={() => {
                onChange(s.name);
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
