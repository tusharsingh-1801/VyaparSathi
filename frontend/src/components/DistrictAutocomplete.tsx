import { useEffect, useRef, useState } from "react";
import { searchLocations } from "../api/client";
import type { LocationSuggestion } from "../types";

interface Props {
  value: string;
  onChange: (value: string, confirmed: boolean) => void;
}

// Captures the district as an identity/display field alongside village — it does not
// gate which village can be picked (village_code alone still resolves the full location
// chain server-side, exactly as before this field existed).
export function DistrictAutocomplete({ value, onChange }: Props) {
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
        setSuggestions(result.suggestions.filter((s) => s.level === "district"));
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => window.clearTimeout(debounceRef.current);
  }, [value]);

  return (
    <div className="autocomplete">
      <label htmlFor="districtName">District</label>
      <input
        id="districtName"
        type="text"
        value={value}
        placeholder="Start typing a district name..."
        onChange={(e) => {
          onChange(e.target.value, false);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      <p className="field-hint">Pick a district from the list — free text won't be accepted.</p>
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
