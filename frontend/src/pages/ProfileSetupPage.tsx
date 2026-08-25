import { useEffect, useState } from "react";
import { createApplicant, fetchCategories } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { VillageAutocomplete } from "../components/VillageAutocomplete";
import { DistrictAutocomplete } from "../components/DistrictAutocomplete";
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

  const [name, setName] = useState("");
  const [districtName, setDistrictName] = useState("");
  const [districtConfirmed, setDistrictConfirmed] = useState(false);
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

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!districtConfirmed) {
      setError("Please pick a district from the suggestion list.");
      return;
    }
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
        name: name.trim(),
        villageName,
        categoryId,
        marginCapital: capital,
        socialCategory: socialCategory || null,
        expectedMonthlyIncome: expectedMonthlyIncome ? Number(expectedMonthlyIncome) : null,
        preferredLanguage,
      });
      setApplicant(res.applicant, res.villagePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create business profile.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Log in to your business profile</h1>
        <p>Enter your name, district and village to continue — no password needed.</p>
      </header>

      <form className="analyze-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <DistrictAutocomplete
          value={districtName}
          onChange={(v, confirmed) => {
            setDistrictName(v);
            setDistrictConfirmed(confirmed);
          }}
        />

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
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
