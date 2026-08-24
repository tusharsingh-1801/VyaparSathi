import { useState } from "react";
import "./App.css";
import { analyzeBusiness } from "./api/client";
import { AnalyzeForm } from "./components/AnalyzeForm";
import { FinancialSummary } from "./components/FinancialSummary";
import { MarketDataSection } from "./components/MarketDataSection";
import { AIAnalysisSection } from "./components/AIAnalysisSection";
import type { AnalyzeResponse } from "./types";

function App() {
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
      const response = await analyzeBusiness(input);
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
        <h1>AI Business Advisory</h1>
        <p>Hyper-local business feasibility and scheme guidance for rural entrepreneurs.</p>
      </header>

      <main className="page-main">
        <AnalyzeForm onSubmit={handleSubmit} loading={loading} />

        {error && <p className="error-banner">{error}</p>}

        {result && (
          <div className="results">
            <FinancialSummary financial={result.financial} />
            <MarketDataSection result={result} />
            <AIAnalysisSection aiAnalysis={result.aiAnalysis} aiError={result.aiError} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
