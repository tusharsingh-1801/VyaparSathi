import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { formatINR } from "../utils/format";
import type { ReportRow } from "../types";

export function ReportsListPage() {
  const { applicant } = useProfile();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicant) {
      setLoading(false);
      return;
    }
    listReports(applicant.id)
      .then((res) => setReports(res.reports))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load reports."))
      .finally(() => setLoading(false));
  }, [applicant]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Report history</h1>
        <p>Every saved Business Advisory analysis, with financial planning attached.</p>
      </header>

      {!applicant && (
        <p className="warning-banner">
          No business profile set. <Link to="/profile">Create one</Link> to start saving reports.
        </p>
      )}
      {error && <p className="error-banner">{error}</p>}
      {loading && applicant && <p className="muted">Loading...</p>}

      {applicant && !loading && reports.length === 0 && !error && (
        <p className="muted">
          No saved reports yet. Run an analysis on the <Link to="/advisory">Business Advisory</Link> page.
        </p>
      )}

      {reports.length > 0 && (
        <div className="card">
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
                {reports.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.generated_at).toLocaleDateString()}</td>
                    <td>{r.numbers.scheme?.name ?? "—"}</td>
                    <td>{formatINR(r.numbers.projectCost)}</td>
                    <td>{formatINR(r.numbers.loanAmount)}</td>
                    <td>
                      <Link to={`/reports/${r.id}`}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
