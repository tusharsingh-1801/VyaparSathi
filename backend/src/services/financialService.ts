import { AppError } from "../utils/AppError";
import { FinancialResult, SchemeRow } from "../types";

// Fixed by the problem statement's scheme design: the beneficiary always puts in 10%
// margin money and the financing agency covers 90% of project cost. This mirrors
// schemes.margin_pct / schemes.max_loan_pct in the DB (both rows currently store 10/90),
// but the *bracket* that decides which scheme applies has to be computed before we know
// which scheme row to read, so the 10% assumption is applied once up front here.
const BENEFICIARY_MARGIN_PCT = 10;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Standard reducing-balance EMI formula. Moratorium months are a payment holiday —
// repayment happens over (tenure - moratorium) months, which is the simplifying
// assumption used here (interest is not separately capitalised during moratorium).
function calculateEMI(principal: number, annualInterestRatePct: number, repaymentMonths: number): number {
  if (principal <= 0 || repaymentMonths <= 0) return 0;

  const monthlyRate = annualInterestRatePct / 12 / 100;
  if (monthlyRate === 0) return round2(principal / repaymentMonths);

  const factor = Math.pow(1 + monthlyRate, repaymentMonths);
  return round2((principal * monthlyRate * factor) / (factor - 1));
}

/**
 * Pure, deterministic financial engine. Takes the active schemes fetched from the DB
 * (never hard-coded) and computes project cost, loan amount, applicable scheme, EMI,
 * and total repayment. The LLM must never perform these calculations — this is the
 * single source of truth for every number in the financial part of the response.
 */
export function calculateFinancials(
  availableMarginCapital: number,
  activeSchemes: SchemeRow[]
): FinancialResult {
  if (!Number.isFinite(availableMarginCapital) || availableMarginCapital <= 0) {
    throw new AppError("availableMarginCapital must be a positive number.", 400);
  }

  if (activeSchemes.length === 0) {
    throw new AppError("No active schemes are configured in the database.", 500);
  }

  const projectCost = round2(availableMarginCapital / (BENEFICIARY_MARGIN_PCT / 100));

  // Schemes are ordered ascending by min_project_cost, so the first one whose
  // max_project_cost covers this project cost is the correct bracket.
  const scheme = activeSchemes.find((s) => projectCost <= s.max_project_cost) ?? null;

  if (!scheme) {
    const largestCovered = activeSchemes[activeSchemes.length - 1].max_project_cost;
    return {
      availableMarginCapital,
      projectCost,
      schemeApplicable: false,
      scheme: null,
      loanAmountRequested: null,
      loanAmount: null,
      loanCapped: false,
      loanShortfall: null,
      beneficiaryContribution: null,
      additionalOwnContributionRequired: null,
      emiEstimateMonthly: null,
      totalRepaymentEstimate: null,
      totalInterestEstimate: null,
      repaymentMonths: null,
      message: `Project cost of ₹${projectCost.toLocaleString(
        "en-IN"
      )} exceeds the maximum project cost (₹${largestCovered.toLocaleString(
        "en-IN"
      )}) covered by any active scheme.`,
    };
  }

  const loanAmountRequested = round2(projectCost * (scheme.max_loan_pct / 100));
  const loanCapped = loanAmountRequested > scheme.max_loan_amount;
  const loanAmount = loanCapped ? scheme.max_loan_amount : loanAmountRequested;
  const loanShortfall = loanCapped ? round2(loanAmountRequested - loanAmount) : 0;

  const beneficiaryContribution = round2(projectCost - loanAmount);
  const additionalOwnContributionRequired = loanCapped ? loanShortfall : 0;

  const repaymentMonths = scheme.tenure_years * 12 - scheme.moratorium_months;
  const emiEstimateMonthly = calculateEMI(loanAmount, scheme.interest_rate, repaymentMonths);
  const totalRepaymentEstimate = round2(emiEstimateMonthly * repaymentMonths);
  const totalInterestEstimate = round2(totalRepaymentEstimate - loanAmount);

  return {
    availableMarginCapital,
    projectCost,
    schemeApplicable: true,
    scheme: {
      id: scheme.id,
      name: scheme.name,
      interestRate: scheme.interest_rate,
      tenureYears: scheme.tenure_years,
      moratoriumMonths: scheme.moratorium_months,
      repaymentFrequency: scheme.repayment_frequency,
    },
    loanAmountRequested,
    loanAmount,
    loanCapped,
    loanShortfall: loanCapped ? loanShortfall : null,
    beneficiaryContribution,
    additionalOwnContributionRequired: loanCapped ? additionalOwnContributionRequired : null,
    emiEstimateMonthly,
    totalRepaymentEstimate,
    totalInterestEstimate,
    repaymentMonths,
    message: loanCapped
      ? `Loan amount was capped at the scheme maximum of ₹${scheme.max_loan_amount.toLocaleString(
          "en-IN"
        )}. You will need an additional ₹${loanShortfall.toLocaleString(
          "en-IN"
        )} of your own funds to cover the full project cost.`
      : null,
  };
}
