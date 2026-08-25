import { useEffect, useMemo, useState } from "react";
import { createFinancialPlan } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import { FinancialSummary } from "../components/FinancialSummary";
import { CashFlowChart } from "../components/charts/CashFlowChart";
import { LoadingState } from "../components/shared/LoadingState";
import { ErrorState } from "../components/shared/ErrorState";
import { formatINR } from "../utils/format";
import { setPageContext } from "../utils/pageContext";
import type { CashFlowMonth, FinancialPlanResult } from "../types";

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

// Regenerates the 12-month projection for an arbitrary loan amount the user picks, without
// a round-trip to the backend. EMI scales linearly with principal for a fixed rate/tenure
// (same fact the backend's safe-loan calc relies on), so this stays mathematically
// consistent with the server-computed max/safe figures while being instant to explore.
function recomputeCashFlow(
  loanAmount: number,
  emiPerRupee: number,
  moratoriumMonths: number,
  revenue: number,
  expenses: number
): { cashFlow: CashFlowMonth[]; breakEvenMonth: number | null; emi: number } {
  const emi = round2(emiPerRupee * loanAmount);
  const cashFlow: CashFlowMonth[] = [];
  let cashReserve = 0;
  let breakEvenMonth: number | null = null;

  for (let month = 1; month <= 12; month++) {
    const monthEmi = month <= moratoriumMonths ? 0 : emi;
    const grossProfit = round2(revenue - expenses);
    const netCashFlow = round2(grossProfit - monthEmi);
    cashReserve = round2(cashReserve + netCashFlow);
    if (breakEvenMonth === null && cashReserve >= 0) breakEvenMonth = month;
    cashFlow.push({ month, revenue, operatingCosts: expenses, grossProfit, emi: monthEmi, netCashFlow, cashReserve });
  }

  return { cashFlow, breakEvenMonth, emi };
}

export function FinancialPlannerPage() {
  const { applicant } = useProfile();
  const { t } = useTranslation();

  const [marginCapital, setMarginCapital] = useState(applicant ? String(applicant.margin_capital) : "100000");
  const [expectedRevenue, setExpectedRevenue] = useState("60000");
  const [operatingExpenses, setOperatingExpenses] = useState("30000");

  const [result, setResult] = useState<FinancialPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customLoan, setCustomLoan] = useState<number | null>(null);

  async function runCalculate() {
    const capital = Number(marginCapital);
    const revenue = Number(expectedRevenue);
    const expenses = Number(operatingExpenses);
    if (!Number.isFinite(capital) || capital <= 0) return setError("Margin capital must be a positive number.");
    if (!Number.isFinite(revenue) || revenue < 0) return setError("Expected revenue must be a non-negative number.");
    if (!Number.isFinite(expenses) || expenses < 0) return setError("Operating expenses must be a non-negative number.");

    setLoading(true);
    setError(null);
    try {
      const res = await createFinancialPlan({
        availableMarginCapital: capital,
        expectedMonthlyRevenue: revenue,
        monthlyOperatingExpenses: expenses,
      });
      setResult(res);
      setCustomLoan(res.safeLoanAmount);
      setPageContext(
        `User just calculated a Financial Plan on the Financial Planner page — ` +
          `margin capital ${capital}, expected revenue ${revenue}/mo, operating expenses ${expenses}/mo. ` +
          `Result: max loan ${res.maxLoanAmount}, safe loan ${res.safeLoanAmount} ` +
          `(${res.safeLoanExplanation}), EMI coverage ratio ${res.emiCoverageRatio}x, ` +
          `break-even month ${res.breakEvenMonth ?? "not within 12 months"}.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not calculate financial plan.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCalculate();
  }

  const emiPerRupee = useMemo(() => {
    if (!result?.maxLoanAmount || !result.financial.emiEstimateMonthly) return null;
    return result.financial.emiEstimateMonthly / result.maxLoanAmount;
  }, [result]);

  const customProjection = useMemo(() => {
    if (customLoan === null || emiPerRupee === null || !result?.financial.scheme) return null;
    return recomputeCashFlow(
      customLoan,
      emiPerRupee,
      result.financial.scheme.moratoriumMonths,
      Number(expectedRevenue),
      Number(operatingExpenses)
    );
  }, [customLoan, emiPerRupee, result, expectedRevenue, operatingExpenses]);

  // Keep the slider valid if the user recalculates with different inputs.
  useEffect(() => {
    if (result?.safeLoanAmount !== undefined) setCustomLoan(result.safeLoanAmount);
  }, [result]);

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("financial.title")}</h1>
        <p>{t("financial.subtitle")}</p>
      </header>

      <form className="analyze-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="capital">{t("financial.marginCapital")}</label>
          <input id="capital" type="number" min="1" value={marginCapital} onChange={(e) => setMarginCapital(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="revenue">{t("financial.expectedRevenue")}</label>
          <input id="revenue" type="number" min="0" value={expectedRevenue} onChange={(e) => setExpectedRevenue(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="expenses">{t("financial.operatingExpenses")}</label>
          <input id="expenses" type="number" min="0" value={operatingExpenses} onChange={(e) => setOperatingExpenses(e.target.value)} />
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? t("common.loading") : t("financial.calculate")}
        </button>
      </form>

      {loading && <LoadingState />}
      {error && !loading && <ErrorState message={error} onRetry={runCalculate} />}

      {result && !loading && (
        <div className="results">
          <section className="card">
            <h2>{t("financial.maxLoan")} vs {t("financial.safeLoan")}</h2>
            <div className="stat-grid">
              <div className="stat">
                <span className="stat-label">{t("financial.maxLoan")}</span>
                <span className="stat-value">{formatINR(result.maxLoanAmount)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{t("financial.safeLoan")}</span>
                <span className="stat-value">{formatINR(result.safeLoanAmount)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{t("financial.breakEven")}</span>
                <span className="stat-value">{result.breakEvenMonth ?? "—"}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{t("financial.emiCoverage")}</span>
                <span className="stat-value">{result.emiCoverageRatio ?? "—"}x</span>
              </div>
            </div>
            <p className="notice">{result.safeLoanExplanation}</p>
          </section>

          {result.maxLoanAmount !== null && emiPerRupee !== null && customLoan !== null && (
            <section className="card">
              <h2>Try a different loan amount</h2>
              <p className="muted">
                Drag to explore any loan amount up to the scheme maximum — EMI and the 12-month
                projection below update instantly, without recalculating on the server.
              </p>
              <div className="field" style={{ marginTop: 12 }}>
                <label htmlFor="customLoan">
                  Loan amount: {formatINR(customLoan)}
                  {result.safeLoanAmount !== null && customLoan > result.safeLoanAmount && (
                    <span className="warning"> — above the recommended safe amount</span>
                  )}
                </label>
                <input
                  id="customLoan"
                  type="range"
                  min={0}
                  max={result.maxLoanAmount}
                  step={1000}
                  value={customLoan}
                  onChange={(e) => setCustomLoan(Number(e.target.value))}
                />
              </div>
              {customProjection && (
                <div className="stat-grid">
                  <div className="stat">
                    <span className="stat-label">EMI at this amount</span>
                    <span className="stat-value">{formatINR(customProjection.emi)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">{t("financial.breakEven")}</span>
                    <span className="stat-value">{customProjection.breakEvenMonth ?? "Never (12mo)"}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Month-12 cash reserve</span>
                    <span className="stat-value">{formatINR(customProjection.cashFlow[11]?.cashReserve ?? null)}</span>
                  </div>
                </div>
              )}
            </section>
          )}

          {customProjection && (
            <section className="card">
              <h2>{t("financial.cashFlow")} (at your chosen loan amount)</h2>
              <CashFlowChart data={customProjection.cashFlow} />
            </section>
          )}

          <FinancialSummary financial={result.financial} />
        </div>
      )}
    </div>
  );
}
