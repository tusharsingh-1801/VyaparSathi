import { CashFlowMonth, FinancialResult, SchemeRow } from "../types";
import { calculateFinancials } from "./financialService";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// How much cash-flow cushion a "safe" EMI should leave, on top of covering the EMI itself.
// A recommended loan's EMI should be coverable 1.3x over by (revenue - operating costs) —
// a fixed, documented assumption, not a value from any scheme or database table.
const SAFETY_MULTIPLIER = 1.3;

export interface FinancialPlanCalcResult {
  financial: FinancialResult;
  maxLoanAmount: number | null;
  safeLoanAmount: number | null;
  safeLoanExplanation: string;
  cashFlow: CashFlowMonth[];
  breakEvenMonth: number | null;
  emiCoverageRatio: number | null;
}

/**
 * Computes the maximum scheme-eligible loan (from the existing deterministic financial
 * engine) alongside a "safe" recommended loan sized to the user's own revenue/expense
 * inputs — never a database estimate. EMI scales linearly with principal for a fixed
 * rate/tenure, so the safe loan is derived by scaling the max loan's EMI-per-rupee factor,
 * not by re-running amortization math.
 */
export function calculateFinancialPlan(
  availableMarginCapital: number,
  expectedMonthlyRevenue: number,
  monthlyOperatingExpenses: number,
  activeSchemes: SchemeRow[]
): FinancialPlanCalcResult {
  const financial = calculateFinancials(availableMarginCapital, activeSchemes);
  const maxLoanAmount = financial.loanAmount;

  const netCashFlowBeforeEMI = round2(expectedMonthlyRevenue - monthlyOperatingExpenses);

  if (!financial.schemeApplicable || !maxLoanAmount || !financial.emiEstimateMonthly || !financial.scheme) {
    return {
      financial,
      maxLoanAmount,
      safeLoanAmount: null,
      safeLoanExplanation: "No applicable scheme, so a safe loan amount cannot be computed.",
      cashFlow: [],
      breakEvenMonth: null,
      emiCoverageRatio: null,
    };
  }

  const emiPerRupee = financial.emiEstimateMonthly / maxLoanAmount;
  const emiCoverageRatio = round2(netCashFlowBeforeEMI / financial.emiEstimateMonthly);

  let safeLoanAmount: number;
  let safeLoanExplanation: string;

  if (netCashFlowBeforeEMI <= 0) {
    safeLoanAmount = 0;
    safeLoanExplanation =
      "Your expected monthly revenue does not exceed your operating expenses, so no loan amount is currently safe to service from this business alone.";
  } else {
    const uncappedSafeLoan = netCashFlowBeforeEMI / SAFETY_MULTIPLIER / emiPerRupee;
    safeLoanAmount = round2(Math.min(uncappedSafeLoan, maxLoanAmount));
    safeLoanExplanation =
      safeLoanAmount < maxLoanAmount
        ? `Although ₹${maxLoanAmount.toLocaleString("en-IN")} may be financially possible under the scheme rules, your projected cash flow (revenue minus operating costs) suggests ₹${safeLoanAmount.toLocaleString(
            "en-IN"
          )} provides a safer repayment buffer (EMI covered ${SAFETY_MULTIPLIER}x over).`
        : `Your projected cash flow comfortably covers the maximum scheme-eligible loan amount with a ${SAFETY_MULTIPLIER}x safety buffer.`;
  }

  const safeEmi = round2(emiPerRupee * safeLoanAmount);
  const moratoriumMonths = financial.scheme.moratoriumMonths;

  const cashFlow: CashFlowMonth[] = [];
  let cashReserve = 0;
  let breakEvenMonth: number | null = null;

  for (let month = 1; month <= 12; month++) {
    const emi = month <= moratoriumMonths ? 0 : safeEmi;
    const grossProfit = round2(expectedMonthlyRevenue - monthlyOperatingExpenses);
    const netCashFlow = round2(grossProfit - emi);
    cashReserve = round2(cashReserve + netCashFlow);

    if (breakEvenMonth === null && cashReserve >= 0) breakEvenMonth = month;

    cashFlow.push({
      month,
      revenue: expectedMonthlyRevenue,
      operatingCosts: monthlyOperatingExpenses,
      grossProfit,
      emi,
      netCashFlow,
      cashReserve,
    });
  }

  return {
    financial,
    maxLoanAmount,
    safeLoanAmount,
    safeLoanExplanation,
    cashFlow,
    breakEvenMonth,
    emiCoverageRatio,
  };
}
