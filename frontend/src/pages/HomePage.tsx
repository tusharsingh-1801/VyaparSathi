import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { formatINR } from "../utils/format";
import type { ReportRow } from "../types";

export function HomePage() {
  const { applicant } = useProfile();
  const [latestReport, setLatestReport] = useState<ReportRow | null>(null);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (!applicant) return;
    listReports(applicant.id)
      .then((res) => {
        setReportCount(res.reports.length);
        setLatestReport(res.reports[0] ?? null);
      })
      .catch(() => {
        setReportCount(0);
        setLatestReport(null);
      });
  }, [applicant]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Welcome back</h1>
        <p>Your hyper-local business advisory dashboard.</p>
      </header>

      <div className="results">
        <section className="card">
          <h2>Quick actions</h2>
          <div className="quick-actions">
            <Link className="quick-action" to="/advisory">
              Run a new analysis
            </Link>
            <Link className="quick-action" to="/reports">
              View report history ({reportCount})
            </Link>
            <Link className="quick-action" to="/discovery">
              Explore schemes &amp; recommendations
            </Link>
            <Link className="quick-action" to="/profile">
              Manage business profile
            </Link>
          </div>
        </section>

        {latestReport && (
          <section className="card">
            <h2>Latest report</h2>
            <div className="stat-grid">
              <div className="stat">
                <span className="stat-label">Scheme</span>
                <span className="stat-value">{latestReport.numbers.scheme?.name ?? "—"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Project cost</span>
                <span className="stat-value">{formatINR(latestReport.numbers.projectCost)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Loan amount</span>
                <span className="stat-value">{formatINR(latestReport.numbers.loanAmount)}</span>
              </div>
            </div>
            <Link to={`/reports/${latestReport.id}`}>View full report →</Link>
          </section>
        )}
      </div>
    </div>
  );
}
