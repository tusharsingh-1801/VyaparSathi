import { useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryRecommendations } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import { OpportunityBreakdownChart } from "../components/charts/OpportunityBreakdownChart";
import { LoadingState } from "../components/shared/LoadingState";
import { ErrorState } from "../components/shared/ErrorState";
import { EmptyState } from "../components/shared/EmptyState";
import type { OpportunityScoreResult } from "../types";

function scoreTier(score: number | null): "high" | "mid" | "low" | "none" {
  if (score === null) return "none";
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

export function BusinessDiscoveryPage() {
  const { villagePath } = useProfile();
  const { t } = useTranslation();

  const [location, setLocation] = useState(villagePath?.split(",")[0]?.trim() ?? "");
  const [results, setResults] = useState<OpportunityScoreResult[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function runSearch() {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoryRecommendations(location);
      setResults(res.recommendations);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load recommendations.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch();
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("discovery.title")}</h1>
        <p>{t("discovery.subtitle")}</p>
      </header>

      <form className="analyze-form" onSubmit={handleSearch}>
        <LocationAutocomplete value={location} onChange={setLocation} />
        <button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("discovery.searchCta")}
        </button>
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={runSearch} />}

      {!loading && searched && results.length === 0 && (
        <EmptyState title={t("common.insufficientData")} body="No business categories are configured yet." />
      )}

      {!loading && results.length > 0 && (
        <div className="opportunity-list">
          {results.map((r) => (
            <div
              key={r.categoryId}
              className="opportunity-row"
              onClick={() => setExpanded(expanded === r.categoryId ? null : r.categoryId)}
            >
              <div className="opportunity-row-head">
                <div className="opportunity-row-title">
                  <span className="opportunity-rank">{r.rank}</span>
                  <strong>{r.categoryName}</strong>
                </div>
                <span className="opportunity-score-pill" data-tier={scoreTier(r.overallScore)}>
                  {r.overallScore !== null ? `${r.overallScore} / 100` : t("common.insufficientData")}
                </span>
              </div>

              {expanded === r.categoryId && (
                <div className="opportunity-detail" onClick={(e) => e.stopPropagation()}>
                  <h4>{t("discovery.whyRecommended")}</h4>
                  <OpportunityBreakdownChart result={r} />
                  <ul>
                    {Object.values(r.subScores).map((s) => (
                      <li key={s.label} className="muted">
                        <strong>{s.label}:</strong> {s.explanation}
                      </li>
                    ))}
                  </ul>
                  <Link to="/financial">
                    <button type="button">{t("discovery.getFinancialPlan")}</button>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
