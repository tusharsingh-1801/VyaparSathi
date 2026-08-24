import { useEffect, useState } from "react";
import { fetchCategories } from "../api/client";
import type { BusinessCategory } from "../types";
import { LocationAutocomplete } from "./LocationAutocomplete";

interface Props {
  onSubmit: (input: { location: string; businessCategory: string; availableMarginCapital: number }) => void;
  loading: boolean;
}

export function AnalyzeForm({ onSubmit, loading }: Props) {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [marginCapital, setMarginCapital] = useState("100000");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories()
      .then((res) => {
        setCategories(res.categories);
        if (res.categories.length > 0) setBusinessCategory(res.categories[0].id);
      })
      .catch((err) => setCategoriesError(err.message));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!location.trim()) {
      setFormError("Please enter a location.");
      return;
    }
    if (!businessCategory) {
      setFormError("Please choose a business category.");
      return;
    }
    const capital = Number(marginCapital);
    if (!Number.isFinite(capital) || capital <= 0) {
      setFormError("Available margin capital must be a positive number.");
      return;
    }

    onSubmit({ location: location.trim(), businessCategory, availableMarginCapital: capital });
  }

  return (
    <form className="analyze-form" onSubmit={handleSubmit}>
      <LocationAutocomplete value={location} onChange={setLocation} />

      <div className="field">
        <label htmlFor="category">Business category</label>
        {categoriesError ? (
          <p className="field-error">Could not load categories: {categoriesError}</p>
        ) : (
          <select
            id="category"
            value={businessCategory}
            onChange={(e) => setBusinessCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="field">
        <label htmlFor="capital">Available margin capital (₹)</label>
        <input
          id="capital"
          type="number"
          min="1"
          step="1"
          value={marginCapital}
          onChange={(e) => setMarginCapital(e.target.value)}
        />
      </div>

      {formError && <p className="field-error">{formError}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Analyzing..." : "Analyze business"}
      </button>
    </form>
  );
}
