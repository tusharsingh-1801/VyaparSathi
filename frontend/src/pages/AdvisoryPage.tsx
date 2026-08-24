import { useState } from "react";
import { Link } from "react-router-dom";
import { analyzeBusiness } from "../api/client";
import { AnalyzeForm } from "../components/AnalyzeForm";
import { FinancialSummary } from "../components/FinancialSummary";
import { MarketDataSection } from "../components/MarketDataSection";
import { AIAnalysisSection } from "../components/AIAnalysisSection";
import { useProfile } from "../context/ProfileContext";
import type { AnalyzeResponse } from "../types";

export function AdvisoryPage() {
  const { applicant } = useProfile();
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: {
    location: string;
    businessCategory: string;
    availableMarginCapital: number;
  }) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await analyzeBusiness({ ...input, applicantId: applicant?.id });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Business Advisory</h1>
        <p>Analyze a business idea against real local data and get scheme-backed financing.</p>
      </header>

      <main className="page-main">
        <AnalyzeForm onSubmit={handleSubmit} loading={loading} />

        {error && <p className="error-banner">{error}</p>}

        {result && (
          <div className="results">
            {result.savedReportId && (
              <p className="notice-banner">
                Saved to your report history.{" "}
                <Link to={`/reports/${result.savedReportId}`}>View financial planning &amp; details →</Link>
              </p>
            )}
            {result.saveError && (
              <p className="warning-banner">Analysis succeeded, but saving it failed: {result.saveError}</p>
            )}
            {!applicant && (
              <p className="warning-banner">
                No business profile is set — this analysis was not saved.{" "}
                <Link to="/profile">Create a profile</Link> to save future reports.
              </p>
            )}

            <FinancialSummary financial={result.financial} />
            <MarketDataSection result={result} />
            <AIAnalysisSection aiAnalysis={result.aiAnalysis} aiError={result.aiError} />
          </div>
        )}
      </main>
    </div>
  );
}
