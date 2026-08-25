import { useEffect, useState } from "react";
import { generateFeasibilityReport, listFeasibilityReports } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import type { FeasibilityReportRow } from "../types";

const VERDICT_LABEL: Record<FeasibilityReportRow["verdict"], string> = {
  go: "Go",
  go_with_caution: "Go, with caution",
  no_go: "No-go",
};

const VERDICT_CLASS: Record<FeasibilityReportRow["verdict"], string> = {
  go: "verdict-go",
  go_with_caution: "verdict-caution",
  no_go: "verdict-no-go",
};

function ReportView({ report }: { report: FeasibilityReportRow }) {
  return (
    <div className="card">
      <div className={"verdict-banner " + VERDICT_CLASS[report.verdict]}>
        <span className="verdict-label">{VERDICT_LABEL[report.verdict]}</span>
        <span className="muted">Confidence: {report.confidence}</span>
      </div>

      <div className="card-grid" style={{ marginTop: 16 }}>
        {Object.entries(report.sections).map(([key, section]) => (
          <div key={key} className="card">
            <h3>{section.label}</h3>
            {section.score !== null && <div className="muted">Score: {section.score}/100</div>}
            <p>{section.narrative}</p>
          </div>
        ))}
      </div>

      {report.key_strengths.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3>Key strengths</h3>
          <ul>
            {report.key_strengths.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {report.key_concerns.length > 0 && (
        <div>
          <h3>Key concerns</h3>
          <ul>
            {report.key_concerns.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {report.recommended_next_steps.length > 0 && (
        <div>
          <h3>Recommended next steps</h3>
          <ul>
            {report.recommended_next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function FeasibilityReportPage() {
  const { applicant } = useProfile();
  const { t } = useTranslation();

  const [reports, setReports] = useState<FeasibilityReportRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeasibilityReportRow | null>(null);

  useEffect(() => {
    if (!applicant) {
      setLoadingHistory(false);
      return;
    }
    listFeasibilityReports(applicant.id)
      .then((res) => {
        setReports(res.reports);
        if (res.reports.length > 0) setSelected(res.reports[0]);
      })
      .catch(() => setReports([]))
      .finally(() => setLoadingHistory(false));
  }, [applicant]);

  async function handleGenerate() {
    if (!applicant) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await generateFeasibilityReport(applicant.id);
      setReports((prev) => [res.report, ...prev]);
      setSelected(res.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the feasibility report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("nav.report")}</h1>
        <p>A structured go/no-go assessment of your current business plan, generated from your saved profile and data.</p>
      </header>

      {!applicant && <p className="muted">Log in with a business profile to generate a feasibility report.</p>}

      {applicant && (
        <>
          <button type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate feasibility report"}
          </button>
          {generating && <p className="muted">Running a full AI analysis of your profile...</p>}

          {error && <p className="field-error">{error}</p>}

          {selected && (
            <div style={{ marginTop: 20 }}>
              <ReportView report={selected} />
            </div>
          )}

          {!loadingHistory && reports.length > 1 && (
            <div style={{ marginTop: 20 }}>
              <h3>Report history</h3>
              <div className="card-grid">
                {reports.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={"card scenario-card" + (selected?.id === r.id ? " active" : "")}
                    onClick={() => setSelected(r)}
                  >
                    <div className={VERDICT_CLASS[r.verdict]}>{VERDICT_LABEL[r.verdict]}</div>
                    <div className="muted">{new Date(r.generated_at).toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
