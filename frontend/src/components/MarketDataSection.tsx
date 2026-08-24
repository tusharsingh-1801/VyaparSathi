import type { AnalyzeResponse } from "../types";

export function MarketDataSection({ result }: { result: AnalyzeResponse }) {
  const { marketData, location, locationResolved } = result;

  return (
    <section className="card">
      <h2>Market &amp; local data</h2>

      <p className="confidence-badge" data-level={marketData.dataConfidence}>
        Data confidence: {marketData.dataConfidence}
      </p>

      {locationResolved && location ? (
        <p>
          Matched location: <strong>{location.matchedName}</strong> ({location.matchedLevel})
          {location.district && <> — {location.district.name} district</>}
          {location.state && <>, {location.state.name}</>}
        </p>
      ) : (
        <p className="warning">
          This location was not found in the database. Market data below may be limited or
          unavailable.
        </p>
      )}

      {marketData.risks.length > 0 && (
        <div className="subsection">
          <h3>Known risks for this business category</h3>
          <ul>
            {marketData.risks.map((r, i) => (
              <li key={i}>
                <strong>{r.risk_types?.name ?? "Risk"}</strong> ({r.severity}):{" "}
                {r.evidence ?? r.risk_types?.description ?? "No detail available."}
              </li>
            ))}
          </ul>
        </div>
      )}

      {marketData.schemeTargets.length > 0 && (
        <div className="subsection">
          <h3>Related scheme targets</h3>
          <ul>
            {marketData.schemeTargets.map((t, i) => (
              <li key={i}>
                {t.scheme_name} — target {t.target_units} units
                {t.apply_url && (
                  <>
                    {" "}
                    (
                    <a href={t.apply_url} target="_blank" rel="noreferrer">
                      apply
                    </a>
                    )
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="raw-counts">
        <span>Market opportunities: {marketData.marketOpportunities.length}</span>
        <span>Competitors: {marketData.competitors.length}</span>
        <span>Price signals: {marketData.priceSignals.length}</span>
        <span>Cost norm entries: {marketData.costNorms.length}</span>
        <span>Purchasing power data: {marketData.purchasingPower ? "available" : "unavailable"}</span>
        <span>
          Village demographics: {marketData.villageDemographics ? "available" : "unavailable"}
        </span>
      </div>
    </section>
  );
}
