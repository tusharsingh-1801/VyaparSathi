import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategoryRecommendations, getMarketIntelligence, listReports } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import { ScoreGauge } from "../components/shared/ScoreGauge";
import { OpportunityBreakdownChart } from "../components/charts/OpportunityBreakdownChart";
import { LoadingState } from "../components/shared/LoadingState";
import { ErrorState } from "../components/shared/ErrorState";
import { formatINR } from "../utils/format";
import type { OpportunityScoreResult, ReportRow } from "../types";

function riskLabel(score: number | null): string {
  if (score === null) return "—";
  if (score >= 70) return "Low";
  if (score >= 40) return "Moderate";
  return "High";
}

export function DashboardPage() {
  const { applicant, villagePath } = useProfile();
  const { t } = useTranslation();

  const [top, setTop] = useState<OpportunityScoreResult | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const villageName = villagePath?.split(",")[0]?.trim() ?? "";

  useEffect(() => {
    if (!applicant || !villageName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      getCategoryRecommendations(villageName),
      listReports(applicant.id),
      getMarketIntelligence(villageName, applicant.id),
    ])
      .then(([recRes, reportsRes, miRes]) => {
        setTop(recRes.recommendations[0] ?? null);
        setReports(reportsRes.reports);
        setConfidence(miRes.confidence.overallPct);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load dashboard."))
      .finally(() => setLoading(false));
  }, [applicant, villageName]);

  const latestReport = reports[0] ?? null;

  if (loading) return <div className="page"><LoadingState /></div>;
  if (error) return <div className="page"><ErrorState message={error} /></div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("dashboard.welcome")}</h1>
        <p>{t("dashboard.subtitle")}</p>
      </header>

      <div className="results">
        <section className="card">
          <h2>{t("dashboard.title")}</h2>

          {!top ? (
            <p className="muted">{t("dashboard.noProfileYet")}</p>
          ) : (
            <>
              <div className="hero-scores">
                <ScoreGauge value={top.overallScore} label={t("dashboard.opportunityScore")} />
                <ScoreGauge
                  value={top.subScores.risk.score}
                  label={t("dashboard.financialHealth")}
                  suffix=""
                />
                <ScoreGauge value={confidence} label={t("dashboard.dataConfidence")} suffix="%" />
              </div>

              <div className="stat-grid">
                <div className="stat">
                  <span className="stat-label">Recommended business</span>
                  <span className="stat-value">{top.categoryName}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("dashboard.recommendedProject")}</span>
                  <span className="stat-value">{formatINR(latestReport?.numbers.projectCost ?? null)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("dashboard.recommendedLoan")}</span>
                  <span className="stat-value">{formatINR(latestReport?.numbers.loanAmount ?? null)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("dashboard.recommendedScheme")}</span>
                  <span className="stat-value">{latestReport?.numbers.scheme?.name ?? "—"}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("dashboard.riskLevel")}</span>
                  <span className="stat-value">{riskLabel(top.subScores.risk.score)}</span>
                </div>
              </div>

              <div className="subsection">
                <h3>Opportunity score breakdown</h3>
                <OpportunityBreakdownChart result={top} />
              </div>

              <Link to="/discovery">
                <button type="button" style={{ marginTop: 8 }}>
                  {t("dashboard.cta")}
                </button>
              </Link>
            </>
          )}
        </section>

        <section className="card">
          <h2>{t("dashboard.quickActions")}</h2>
          <div className="quick-actions">
            <Link className="quick-action" to="/discovery">
              {t("nav.discovery")}
            </Link>
            <Link className="quick-action" to="/market">
              {t("nav.market")}
            </Link>
            <Link className="quick-action" to="/financial">
              {t("nav.financial")}
            </Link>
            <Link className="quick-action" to="/schemes">
              {t("nav.schemes")}
            </Link>
          </div>
        </section>

        {reports.length > 0 && (
          <section className="card">
            <h2>{t("dashboard.recentReports")}</h2>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Scheme</th>
                    <th>Project cost</th>
                    <th>Loan amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.generated_at).toLocaleDateString()}</td>
                      <td>{r.numbers.scheme?.name ?? "—"}</td>
                      <td>{formatINR(r.numbers.projectCost)}</td>
                      <td>{formatINR(r.numbers.loanAmount)}</td>
                      <td>
                        <Link to={`/reports/${r.id}`}>{t("common.viewDetails")} →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
