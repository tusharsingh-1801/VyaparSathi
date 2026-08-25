import { useEffect, useState } from "react";
import { fetchCategories, getApplicant, updateApplicant } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { VillageAutocomplete } from "../components/VillageAutocomplete";
import { formatINR } from "../utils/format";
import type { BusinessCategory } from "../types";

export function ProfilePage() {
  const { applicant, refresh } = useProfile();
  const [villagePath, setVillagePath] = useState<string | null>(null);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [villageName, setVillageName] = useState("");
  const [villageConfirmed, setVillageConfirmed] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [marginCapital, setMarginCapital] = useState("");
  const [socialCategory, setSocialCategory] = useState("");
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!applicant) return;
    getApplicant(applicant.id)
      .then((res) => setVillagePath(res.villagePath))
      .catch(() => setVillagePath(null));
    setName(applicant.name ?? "");
    setCategoryId(applicant.category_id);
    setMarginCapital(String(applicant.margin_capital));
    setSocialCategory(applicant.social_category ?? "");
    setExpectedMonthlyIncome(applicant.expected_monthly_income ? String(applicant.expected_monthly_income) : "");
  }, [applicant]);

  if (!applicant) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Business Profile</h1>
        </header>
        <p className="muted">No profile is set up.</p>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === applicant.category_id)?.name ?? applicant.category_id;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!applicant) return;
    setError(null);
    setSaving(true);
    try {
      const patch: Parameters<typeof updateApplicant>[1] = {
        name: name.trim(),
        categoryId,
        marginCapital: Number(marginCapital),
        socialCategory: socialCategory || null,
        expectedMonthlyIncome: expectedMonthlyIncome ? Number(expectedMonthlyIncome) : null,
      };
      if (villageConfirmed && villageName) patch.villageName = villageName;

      await updateApplicant(applicant.id, patch);
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Business Profile</h1>
      </header>

      {!editing ? (
        <div className="card">
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">Name</span>
              <span className="stat-value">{applicant.name ?? "—"}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Village</span>
              <span className="stat-value">{villagePath ?? "—"}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Business category</span>
              <span className="stat-value">{categoryName}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Margin capital</span>
              <span className="stat-value">{formatINR(applicant.margin_capital)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Social category</span>
              <span className="stat-value">{applicant.social_category ?? "—"}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Expected monthly income</span>
              <span className="stat-value">
                {applicant.expected_monthly_income ? formatINR(applicant.expected_monthly_income) : "—"}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Preferred language</span>
              <span className="stat-value">{applicant.preferred_language}</span>
            </div>
          </div>
          <button type="button" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        </div>
      ) : (
        <form className="analyze-form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <VillageAutocomplete
            value={villageName}
            onChange={(v, confirmed) => {
              setVillageName(v);
              setVillageConfirmed(confirmed);
            }}
          />
          <p className="muted">Current: {villagePath ?? "—"} (leave blank to keep unchanged)</p>

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
            <label htmlFor="capital">Margin capital (₹)</label>
            <input
              id="capital"
              type="number"
              min="1"
              value={marginCapital}
              onChange={(e) => setMarginCapital(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="socialCategory">Social category</label>
            <input
              id="socialCategory"
              type="text"
              value={socialCategory}
              onChange={(e) => setSocialCategory(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="income">Expected monthly income (₹)</label>
            <input
              id="income"
              type="number"
              min="0"
              value={expectedMonthlyIncome}
              onChange={(e) => setExpectedMonthlyIncome(e.target.value)}
            />
          </div>

          {error && <p className="field-error">{error}</p>}

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
