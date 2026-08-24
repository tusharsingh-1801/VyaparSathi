import { useEffect, useState } from "react";
import { getCategoryRecommendations, getSchemes } from "../api/client";
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import type { CategoryRecommendation, SchemeRow } from "../types";

type Tab = "schemes" | "recommendations";

export function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>("schemes");

  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [schemesLoading, setSchemesLoading] = useState(true);
  const [schemesError, setSchemesError] = useState<string | null>(null);

  const [location, setLocation] = useState("");
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const [locationResolved, setLocationResolved] = useState<boolean | null>(null);

  useEffect(() => {
    getSchemes()
      .then((res) => setSchemes(res.schemes))
      .catch((err) => setSchemesError(err instanceof Error ? err.message : "Could not load schemes."))
      .finally(() => setSchemesLoading(false));
  }, []);

  async function handleRecommendationsSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;
    setRecLoading(true);
    setRecError(null);
    try {
      const res = await getCategoryRecommendations(location);
      setRecommendations(res.recommendations);
      setLocationResolved(res.locationResolved);
    } catch (err) {
      setRecError(err instanceof Error ? err.message : "Could not load recommendations.");
    } finally {
      setRecLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Discovery</h1>
        <p>Browse available financing schemes, or find which business fits a location best.</p>
      </header>

      <div className="tab-bar">
        <button
          type="button"
          className={"tab-btn" + (tab === "schemes" ? " active" : "")}
          onClick={() => setTab("schemes")}
        >
          Schemes
        </button>
        <button
          type="button"
          className={"tab-btn" + (tab === "recommendations" ? " active" : "")}
          onClick={() => setTab("recommendations")}
        >
          Category Recommendations
        </button>
      </div>

      {tab === "schemes" ? (
        <div className="card">
          {schemesLoading && <p className="muted">Loading...</p>}
          {schemesError && <p className="error-banner">{schemesError}</p>}
          {schemes.length > 0 && (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Scheme</th>
                    <th>Project cost range</th>
                    <th>Max loan</th>
                    <th>Interest</th>
                    <th>Tenure</th>
                    <th>Moratorium</th>
                  </tr>
                </thead>
                <tbody>
                  {schemes.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>
                        ₹{s.min_project_cost.toLocaleString("en-IN")} – ₹
                        {s.max_project_cost.toLocaleString("en-IN")}
                      </td>
                      <td>₹{s.max_loan_amount.toLocaleString("en-IN")}</td>
                      <td>{s.interest_rate}%</td>
                      <td>{s.tenure_years} yrs</td>
                      <td>{s.moratorium_months} mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="results">
          <form className="analyze-form" onSubmit={handleRecommendationsSearch}>
            <LocationAutocomplete value={location} onChange={setLocation} />
            <button type="submit" disabled={recLoading}>
              {recLoading ? "Searching..." : "Find best-fit categories"}
            </button>
          </form>

          {recError && <p className="error-banner">{recError}</p>}

          {locationResolved === false && (
            <p className="warning-banner">This location was not found in the database.</p>
          )}

          {recommendations.length > 0 && (
            <div className="card">
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Category</th>
                      <th>Suitability</th>
                      <th>Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommendations.map((r) => (
                      <tr key={r.categoryId}>
                        <td>{r.rank}</td>
                        <td>{r.categoryName}</td>
                        <td>{r.suitability !== null ? r.suitability : "—"}</td>
                        <td className="muted">{r.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
