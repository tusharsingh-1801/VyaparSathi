import type { RepaymentPeriod } from "../types";
import { formatINR } from "../utils/format";

export function RepaymentScheduleTable({ schedule }: { schedule: RepaymentPeriod[] }) {
  if (schedule.length === 0) {
    return (
      <section className="card">
        <h2>Loan repayment schedule</h2>
        <p className="warning">No repayment schedule is available for this report.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>Loan repayment schedule</h2>
      <p className="muted">
        {schedule.length} periods ({schedule[0].periodType}ly) — moratorium periods carry the balance
        forward with disclosed but unpaid interest.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Phase</th>
              <th>Opening</th>
              <th>Interest</th>
              <th>Principal</th>
              <th>Payment due</th>
              <th>Closing</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((p) => (
              <tr key={p.periodNo} className={p.phase === "moratorium" ? "row-muted" : undefined}>
                <td>{p.periodNo}</td>
                <td>{p.phase}</td>
                <td>{formatINR(p.openingBalance)}</td>
                <td>{formatINR(p.interestAccrued)}</td>
                <td>{formatINR(p.principalRepaid)}</td>
                <td>{formatINR(p.paymentDue)}</td>
                <td>{formatINR(p.closingBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
