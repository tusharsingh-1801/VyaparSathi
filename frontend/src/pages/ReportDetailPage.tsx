import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getReport } from "../api/client";
import { FinancialSummary } from "../components/FinancialSummary";
import { AIAnalysisSection } from "../components/AIAnalysisSection";
import { WorkingCapitalSection } from "../components/WorkingCapitalSection";
import { RepaymentScheduleTable } from "../components/RepaymentScheduleTable";
import type { RepaymentPeriod, ReportRow, WorkingCapitalPlan } from "../types";

type Tab = "overview" | "planning";

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [workingCapital, setWorkingCapital] = useState<WorkingCapitalPlan | null>(null);
  const [repaymentSchedule, setRepaymentSchedule] = useState<RepaymentPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!id) return;
    getReport(id)
      .then((res) => {
        setReport(res.report);
        setWorkingCapital(res.workingCapital?.plan ?? null);
        setRepaymentSchedule(res.repaymentSchedule ?? []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load report."))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Saved report</h1>
        <p>{id}</p>
      </header>

      {loading && <p className="muted">Loading...</p>}
      {error && <p className="error-banner">{error}</p>}

      {report && (
        <>
          <div className="tab-bar">
            <button
              type="button"
              className={"tab-btn" + (tab === "overview" ? " active" : "")}
              onClick={() => setTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              className={"tab-btn" + (tab === "planning" ? " active" : "")}
              onClick={() => setTab("planning")}
            >
              Financial Planning
            </button>
          </div>

          {tab === "overview" ? (
            <div className="results">
              <FinancialSummary financial={report.numbers} />
              <AIAnalysisSection
                aiAnalysis={report.narrative}
                aiError={report.narrative ? null : "No AI narrative was saved for this report."}
              />
            </div>
          ) : (
            <div className="results">
              <WorkingCapitalSection plan={workingCapital} />
              <RepaymentScheduleTable schedule={repaymentSchedule} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
