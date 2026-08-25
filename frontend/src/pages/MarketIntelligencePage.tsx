import { useState } from "react";
import { getMarketIntelligence, submitFieldObservations } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import { LocationAutocomplete } from "../components/LocationAutocomplete";
import { DataSourceBadge } from "../components/shared/DataSourceBadge";
import { LoadingState } from "../components/shared/LoadingState";
import { ErrorState } from "../components/shared/ErrorState";
import { EmptyState } from "../components/shared/EmptyState";
import { formatINR } from "../utils/format";
import type { MarketIntelligenceResult } from "../types";

const OBSERVATION_QUESTIONS = [
  { key: "similar_businesses_5km", text: "How many similar businesses are within 5 km?" },
  { key: "customers_per_day", text: "Roughly how many customers/day does a similar business get?" },
  { key: "local_price", text: "What is the typical local selling price?" },
  { key: "major_supplier", text: "Who is the major local supplier?" },
  { key: "seasonal_demand", text: "Does demand change noticeably by season?" },
];

export function MarketIntelligencePage() {
  const { applicant, villagePath } = useProfile();
  const { t } = useTranslation();

  const [location, setLocation] = useState(villagePath?.split(",")[0]?.trim() ?? "");
  const [result, setResult] = useState<MarketIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidenceBefore, setConfidenceBefore] = useState<number | null>(null);
  const [confidenceAfter, setConfidenceAfter] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function runSearch() {
    if (!location.trim()) return;
    setLoading(true);
    setError(null);
    setConfidenceAfter(null);
    try {
      const res = await getMarketIntelligence(location, applicant?.id);
      setResult(res);
      setConfidenceBefore(res.confidence.overallPct);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load market intelligence.");
    } finally {
      setLoading(false);
    }
  }

  async function handleObservationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!applicant || !result) return;

    const filled = OBSERVATION_QUESTIONS.filter((q) => answers[q.key]?.trim()).map((q) => ({
      questionKey: q.key,
      questionText: q.text,
      answer: answers[q.key].trim(),
    }));
    if (filled.length === 0) return;

    setSubmitting(true);
    try {
      await submitFieldObservations({
        applicantId: applicant.id,
        locationCode: result.location?.village?.code ?? result.location?.block?.code ?? null,
        answers: filled,
      });
      const refreshed = await getMarketIntelligence(location, applicant.id);
      setResult(refreshed);
      setConfidenceAfter(refreshed.confidence.overallPct);
      setAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save observations.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("market.title")}</h1>
        <p>{t("market.subtitle")}</p>
      </header>

      <form
        className="analyze-form"
        onSubmit={(e) => {
          e.preventDefault();
          runSearch();
        }}
      >
        <LocationAutocomplete value={location} onChange={setLocation} />
        <button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("common.viewDetails")}
        </button>
      </form>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={runSearch} />}

      {!loading && result && !result.locationResolved && (
        <EmptyState title={t("common.insufficientData")} body="This location was not found in the database." />
      )}

      {!loading && result && result.locationResolved && (
        <div className="results">
          <section className="card">
            <h2>{t("dashboard.dataConfidence")}</h2>
            <span className="confidence-badge" data-level={result.confidence.overallPct >= 60 ? "high" : result.confidence.overallPct >= 30 ? "medium" : "low"}>
              {result.confidence.overallPct}%
            </span>
            <div className="stat-grid">
              {Object.values(result.confidence.buckets).map((b) => (
                <div className="stat" key={b.label}>
                  <span className="stat-label">{b.label}</span>
                  <span className="stat-value">{b.contribution} / {b.weight}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>{t("market.population")} &amp; {t("market.households")}</h2>
            {result.demographics ? (
              <div className="stat-grid">
                <div className="stat">
                  <DataSourceBadge status="verified" source="Census" />
                  <span className="stat-value">{result.demographics.population?.toLocaleString("en-IN") ?? "—"}</span>
                  <span className="stat-label">{t("market.population")}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{result.demographics.households?.toLocaleString("en-IN") ?? "—"}</span>
                  <span className="stat-label">{t("market.households")}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{result.demographics.literates?.toLocaleString("en-IN") ?? "—"}</span>
                  <span className="stat-label">{t("market.literates")}</span>
                </div>
              </div>
            ) : (
              <p className="warning">{t("common.insufficientData")}</p>
            )}
          </section>

          <section className="card">
            <h2>{t("market.amenities")}</h2>
            {result.amenities ? (
              <div className="raw-counts">
                <span>{t("market.hasBank")}: {result.amenities.has_bank === null ? "—" : result.amenities.has_bank ? "Yes" : "No"}</span>
                <span>{t("market.hasAtm")}: {result.amenities.has_atm === null ? "—" : result.amenities.has_atm ? "Yes" : "No"}</span>
                <span>{t("market.hasMandi")}: {result.amenities.has_mandi === null ? "—" : result.amenities.has_mandi ? "Yes" : "No"}</span>
                <span>{t("market.hasPuccaRoad")}: {result.amenities.has_pucca_road === null ? "—" : result.amenities.has_pucca_road ? "Yes" : "No"}</span>
                <span>{t("market.nearestTown")}: {result.amenities.nearest_town_km ?? "—"} km</span>
              </div>
            ) : (
              <p className="warning">{t("common.insufficientData")}</p>
            )}
          </section>

          <section className="card">
            <h2>{t("market.purchasingPower")}</h2>
            {result.purchasingPower ? (
              <div className="stat-grid">
                <div className="stat">
                  <span className="stat-value">{formatINR(result.purchasingPower.per_capita_income)}</span>
                  <span className="stat-label">{t("market.perCapitaIncome")}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{result.purchasingPower.affordability_index ?? "—"}</span>
                  <span className="stat-label">{t("market.affordabilityIndex")}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{result.districtGrowthRate !== null ? `${(result.districtGrowthRate * 100).toFixed(2)}%` : "—"}</span>
                  <span className="stat-label">{t("market.districtGrowth")}</span>
                </div>
              </div>
            ) : (
              <p className="warning">{t("common.insufficientData")}</p>
            )}
          </section>

          <section className="card">
            <h2>{t("market.priceSignals")}</h2>
            {result.priceSignals.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Commodity</th>
                      <th>Unit</th>
                      <th>Modal price</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.priceSignals.map((p) => (
                      <tr key={p.id}>
                        <td>{p.commodity}</td>
                        <td>{p.unit}</td>
                        <td>{formatINR(p.modal_price)}</td>
                        <td>{p.price_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="warning">{t("common.insufficientData")}</p>
            )}
          </section>

          <section className="card">
            <h2>{t("market.competitors")} &amp; {t("market.enterpriseCounts")}</h2>
            <div className="raw-counts">
              <span>{t("market.competitors")}: {result.competitors.length}</span>
              <span>{t("market.enterpriseCounts")}: {result.enterpriseCounts.reduce((s, e) => s + e.unit_count, 0)}</span>
            </div>
          </section>

          {applicant && (
            <section className="card">
              <h2>{t("market.improveAnalysis")}</h2>
              <p className="muted">{t("market.improveAnalysisDesc")}</p>

              {confidenceAfter !== null && (
                <p className="notice-banner" style={{ marginBottom: 12 }}>
                  {t("market.confidenceBefore")}: {confidenceBefore}% → {t("market.confidenceAfter")}: {confidenceAfter}%
                </p>
              )}

              <form onSubmit={handleObservationSubmit}>
                {OBSERVATION_QUESTIONS.map((q) => (
                  <div className="field" key={q.key}>
                    <label htmlFor={q.key}>{q.text}</label>
                    <input
                      id={q.key}
                      type="text"
                      value={answers[q.key] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.key]: e.target.value }))}
                    />
                  </div>
                ))}
                <button type="submit" disabled={submitting}>
                  {submitting ? t("common.loading") : t("common.submit")}
                </button>
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
