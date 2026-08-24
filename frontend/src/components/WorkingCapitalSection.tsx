import type { WorkingCapitalPlan } from "../types";
import { formatINR } from "../utils/format";

export function WorkingCapitalSection({ plan }: { plan: WorkingCapitalPlan | null }) {
  if (!plan) {
    return (
      <section className="card">
        <h2>Working capital plan</h2>
        <p className="warning">No working capital plan is available for this report.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Working capital plan</h2>

      <div className="stat-grid">
        <div className="stat">
          <span className="stat-label">Capital expenditure</span>
          <span className="stat-value">{formatINR(plan.capitalExpenditure)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Monthly operating cost</span>
          <span className="stat-value">{formatINR(plan.monthlyOperating)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Working capital need</span>
          <span className="stat-value">{formatINR(plan.workingCapitalNeed)}</span>
        </div>
      </div>

      {plan.items.length > 0 && (
        <div className="subsection">
          <h3>Cost breakdown</h3>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {plan.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.item}</td>
                    <td>{item.costType}</td>
                    <td>{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {plan.assumptions.length > 0 && (
        <div className="subsection">
          <h3>Assumptions</h3>
          <ul>
            {plan.assumptions.map((a, i) => (
              <li key={i} className="muted">
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
