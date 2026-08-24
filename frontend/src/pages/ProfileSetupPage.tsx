import { useEffect, useState } from "react";
import { createApplicant, fetchCategories } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { VillageAutocomplete } from "../components/VillageAutocomplete";
import type { BusinessCategory } from "../types";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "awa", name: "Awadhi" },
  { code: "bho", name: "Bhojpuri" },
];

export function ProfileSetupPage() {
  const { setApplicant } = useProfile();
  const [categories, setCategories] = useState<BusinessCategory[]>([]);

  const [villageName, setVillageName] = useState("");
  const [villageConfirmed, setVillageConfirmed] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [marginCapital, setMarginCapital] = useState("100000");
  const [socialCategory, setSocialCategory] = useState("");
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((res) => {
        setCategories(res.categories);
        if (res.categories.length > 0) setCategoryId(res.categories[0].id);
      })
      .catch(() => setCategories([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!villageConfirmed) {
      setError("Please pick a village from the suggestion list.");
      return;
    }
    if (!categoryId) {
      setError("Please choose a business category.");
      return;
    }
    const capital = Number(marginCapital);
    if (!Number.isFinite(capital) || capital <= 0) {
      setError("Margin capital must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createApplicant({
        villageName,
        categoryId,
        marginCapital: capital,
        socialCategory: socialCategory || null,
        expectedMonthlyIncome: expectedMonthlyIncome ? Number(expectedMonthlyIncome) : null,
        preferredLanguage,
      });
      setApplicant(res.applicant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create business profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Create your business profile</h1>
        <p>This becomes the identity the rest of the dashboard is scoped to — no login required.</p>
      </header>

      <form className="analyze-form" onSubmit={handleSubmit}>
        <VillageAutocomplete
          value={villageName}
          onChange={(v, confirmed) => {
            setVillageName(v);
            setVillageConfirmed(confirmed);
          }}
        />

        <div className="field">
          <label htmlFor="category">Business category</label>
          <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="capital">Available margin capital (₹)</label>
          <input
            id="capital"
            type="number"
            min="1"
            value={marginCapital}
            onChange={(e) => setMarginCapital(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="socialCategory">Social category (optional)</label>
          <input
            id="socialCategory"
            type="text"
            placeholder="e.g. General, OBC, SC, ST"
            value={socialCategory}
            onChange={(e) => setSocialCategory(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="income">Expected monthly income (₹, optional)</label>
          <input
            id="income"
            type="number"
            min="0"
            value={expectedMonthlyIncome}
            onChange={(e) => setExpectedMonthlyIncome(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="language">Preferred language</label>
          <select id="language" value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create profile"}
        </button>
      </form>
    </div>
  );
}
