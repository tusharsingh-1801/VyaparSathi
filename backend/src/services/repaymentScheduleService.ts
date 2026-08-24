import { RepaymentPeriod } from "../types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// repayment_schedule.period_type has a DB check constraint accepting only "month" or
// "quarter" (confirmed empirically — "monthly"/"quarterly"/"year"/etc. are all rejected;
// the column's own default is "quarter"). Map the scheme's repayment_frequency wording
// (e.g. "quarterly", as stored in schemes.repayment_frequency) onto the accepted value.
const PERIOD_TYPE_BY_FREQUENCY: Record<string, { periodType: "month" | "quarter"; months: number }> = {
  monthly: { periodType: "month", months: 1 },
  month: { periodType: "month", months: 1 },
  quarterly: { periodType: "quarter", months: 3 },
  quarter: { periodType: "quarter", months: 3 },
};

/**
 * Deterministic period-by-period amortization table.
 *
 * Assumption (kept consistent with financialService's EMI estimate, so the two never
 * disagree): during the moratorium, interest is disclosed per period but neither paid
 * nor capitalized — the opening balance carries forward unchanged. Repayment then
 * amortizes the original loan amount over the remaining periods, exactly matching
 * financialService's repaymentMonths = tenureYears*12 - moratoriumMonths.
 */
export function generateRepaymentSchedule(params: {
  loanAmount: number;
  annualInterestRatePct: number;
  tenureYears: number;
  moratoriumMonths: number;
  repaymentFrequency: string;
}): RepaymentPeriod[] {
  const { loanAmount, annualInterestRatePct, tenureYears, moratoriumMonths, repaymentFrequency } = params;

  if (loanAmount <= 0 || tenureYears <= 0) return [];

  // Defaults to quarterly (the column's own DB default, and what every scheme in this
  // project currently uses) if an unrecognized frequency string is ever passed in.
  const { periodType, months: periodLengthMonths } =
    PERIOD_TYPE_BY_FREQUENCY[repaymentFrequency.toLowerCase()] ?? { periodType: "quarter", months: 3 };
  const totalPeriods = Math.round((tenureYears * 12) / periodLengthMonths);
  const moratoriumPeriods = Math.round(moratoriumMonths / periodLengthMonths);
  const repaymentPeriods = Math.max(totalPeriods - moratoriumPeriods, 0);
  const periodRate = (annualInterestRatePct / 100) * (periodLengthMonths / 12);

  const schedule: RepaymentPeriod[] = [];
  let periodNo = 0;

  // Moratorium phase — balance unchanged, interest disclosed but not charged.
  for (let i = 0; i < moratoriumPeriods; i++) {
    periodNo++;
    const interestAccrued = round2(loanAmount * periodRate);
    schedule.push({
      periodNo,
      periodType,
      phase: "moratorium",
      openingBalance: loanAmount,
      interestAccrued,
      principalRepaid: 0,
      paymentDue: 0,
      closingBalance: loanAmount,
    });
  }

  // Repayment phase — standard reducing-balance amortization.
  if (repaymentPeriods > 0) {
    const paymentDue =
      periodRate === 0
        ? round2(loanAmount / repaymentPeriods)
        : round2(
            (loanAmount * periodRate * Math.pow(1 + periodRate, repaymentPeriods)) /
              (Math.pow(1 + periodRate, repaymentPeriods) - 1)
          );

    let openingBalance = loanAmount;
    for (let i = 0; i < repaymentPeriods; i++) {
      periodNo++;
      const isLast = i === repaymentPeriods - 1;
      const interestAccrued = round2(openingBalance * periodRate);
      const principalRepaid = isLast ? openingBalance : round2(paymentDue - interestAccrued);
      const closingBalance = isLast ? 0 : round2(openingBalance - principalRepaid);

      schedule.push({
        periodNo,
        periodType,
        phase: "repayment",
        openingBalance: round2(openingBalance),
        interestAccrued,
        principalRepaid,
        paymentDue: isLast ? round2(principalRepaid + interestAccrued) : paymentDue,
        closingBalance,
      });

      openingBalance = closingBalance;
    }
  }

  return schedule;
}
