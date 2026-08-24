import type { AIAnalysis } from "../types";

export function AIAnalysisSection({
  aiAnalysis,
  aiError,
}: {
  aiAnalysis: AIAnalysis | null;
  aiError: string | null;
}) {
  if (!aiAnalysis) {
    return (
      <section className="card">
        <h2>AI analysis</h2>
        <p className="warning">AI analysis is unavailable: {aiError ?? "unknown reason"}</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>AI analysis</h2>
      <p className="confidence-badge" data-level={aiAnalysis.dataConfidence}>
        Data confidence: {aiAnalysis.dataConfidence}
      </p>

      <p>{aiAnalysis.summary}</p>

      <div className="subsection">
        <h3>Market opportunity {aiAnalysis.marketOpportunity.score !== null && `(score: ${aiAnalysis.marketOpportunity.score})`}</h3>
        <p>{aiAnalysis.marketOpportunity.analysis}</p>
      </div>

      <div className="subsection">
        <h3>Competition ({aiAnalysis.competition.level})</h3>
        <p>{aiAnalysis.competition.analysis}</p>
      </div>

      <div className="swot-grid">
        <SwotBox title="Strengths" items={aiAnalysis.swot.strengths} />
        <SwotBox title="Weaknesses" items={aiAnalysis.swot.weaknesses} />
        <SwotBox title="Opportunities" items={aiAnalysis.swot.opportunities} />
        <SwotBox title="Threats" items={aiAnalysis.swot.threats} />
      </div>

      {aiAnalysis.risks.length > 0 && (
        <div className="subsection">
          <h3>Risks</h3>
          <ul>
            {aiAnalysis.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {aiAnalysis.recommendations.length > 0 && (
        <div className="subsection">
          <h3>Recommendations</h3>
          <ul>
            {aiAnalysis.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="subsection">
        <h3>Financial interpretation</h3>
        <p>{aiAnalysis.financialAnalysis}</p>
      </div>

      <div className="final-recommendation">
        <h3>Final recommendation</h3>
        <p>{aiAnalysis.finalRecommendation}</p>
      </div>
    </section>
  );
}

function SwotBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="swot-box">
      <h4>{title}</h4>
      {items.length > 0 ? (
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="muted">None identified.</p>
      )}
    </div>
  );
}
