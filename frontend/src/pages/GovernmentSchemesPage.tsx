import { useEffect, useState } from "react";
import { getSchemes } from "../api/client";
import { useTranslation } from "../i18n/LanguageContext";
import { LoadingState } from "../components/shared/LoadingState";
import { ErrorState } from "../components/shared/ErrorState";
import { formatINR } from "../utils/format";
import type { SchemeRow } from "../types";

export function GovernmentSchemesPage() {
  const { t } = useTranslation();
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    getSchemes()
      .then((res) => {
        setSchemes(res.schemes);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load schemes."))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("schemes.title")}</h1>
        <p>{t("schemes.subtitle")}</p>
      </header>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={load} />}

      {!loading && schemes.length > 0 && (
        <div className="results">
          {schemes.map((s) => (
            <section className="card" key={s.id}>
              <h2>{s.name}</h2>
              <p className="muted">{s.name_hi}</p>
              <div className="stat-grid" style={{ marginTop: 12 }}>
                <div className="stat">
                  <span className="stat-label">Project cost range</span>
                  <span className="stat-value">
                    {formatINR(s.min_project_cost)} – {formatINR(s.max_project_cost)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("schemes.maxLoan")}</span>
                  <span className="stat-value">{formatINR(s.max_loan_amount)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("schemes.interest")}</span>
                  <span className="stat-value">{s.interest_rate}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("schemes.tenure")}</span>
                  <span className="stat-value">{s.tenure_years} yrs</span>
                </div>
                <div className="stat">
                  <span className="stat-label">{t("schemes.moratorium")}</span>
                  <span className="stat-value">{s.moratorium_months} mo</span>
                </div>
              </div>
              <p className="notice">
                Implementing agency: {s.implementing_agency ?? "—"} · Eligibility must be confirmed
                with the agency —{" "}
                <span className="data-source-badge" data-status="estimated">
                  {t("schemes.needsVerification")}
                </span>
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
