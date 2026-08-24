import type { FinancialResult } from "../types";
import { formatINR } from "../utils/format";

export function FinancialSummary({ financial }: { financial: FinancialResult }) {
  return (
    <section className="card">
      <h2>Financial feasibility</h2>

      <div className="stat-grid">
        <Stat label="Project cost" value={formatINR(financial.projectCost)} />
        <Stat label="Loan amount" value={formatINR(financial.loanAmount)} />
        <Stat
          label="Beneficiary contribution"
          value={formatINR(financial.beneficiaryContribution)}
        />
        <Stat label="EMI (monthly est.)" value={formatINR(financial.emiEstimateMonthly)} />
        <Stat
          label="Total repayment (est.)"
          value={formatINR(financial.totalRepaymentEstimate)}
        />
        <Stat label="Total interest (est.)" value={formatINR(financial.totalInterestEstimate)} />
      </div>

      {financial.schemeApplicable && financial.scheme ? (
        <div className="scheme-box">
          <h3>{financial.scheme.name}</h3>
          <ul>
            <li>Interest rate: {financial.scheme.interestRate}% p.a.</li>
            <li>Tenure: {financial.scheme.tenureYears} years</li>
            <li>Moratorium: {financial.scheme.moratoriumMonths} months</li>
            <li>Repayment frequency: {financial.scheme.repaymentFrequency}</li>
          </ul>
        </div>
      ) : (
        <p className="warning">No active scheme currently covers this project size.</p>
      )}

      {financial.message && <p className="notice">{financial.message}</p>}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}
