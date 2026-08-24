import { CostNormRow, WorkingCapitalItem, WorkingCapitalPlan } from "../types";

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deterministic working capital estimate, built entirely from `cost_norms` percentages
 * applied to the financial engine's project cost. No revenue/profitability data exists
 * anywhere in the schema for a not-yet-started business, so expectedMonthlyRevenue and
 * breakEvenMonths are left null rather than guessed — this is disclosed via `assumptions`.
 */
export function calculateWorkingCapitalPlan(
  projectCost: number,
  costNorms: CostNormRow[]
): Omit<WorkingCapitalPlan, "reportId"> & { itemsWithCostNormId: Array<WorkingCapitalItem & { costNormId: number }> } {
  const assumptions: string[] = [];

  if (costNorms.length === 0) {
    assumptions.push(
      "No cost norm data is available in the database for this business category — working capital could not be estimated."
    );
    return {
      capitalExpenditure: 0,
      monthlyOperating: 0,
      wcCycleMonths: 0,
      workingCapitalNeed: 0,
      expectedMonthlyRevenue: null,
      breakEvenMonths: null,
      items: [],
      assumptions,
      itemsWithCostNormId: [],
    };
  }

  const itemsWithCostNormId: Array<WorkingCapitalItem & { costNormId: number }> = [];
  let capitalExpenditure = 0;
  let monthlyOperating = 0;

  for (const norm of costNorms) {
    if (norm.cost_type === "capital" && norm.pct_of_project !== null) {
      const amount = round2((norm.pct_of_project / 100) * projectCost);
      capitalExpenditure += amount;
      itemsWithCostNormId.push({ item: norm.item, costType: "capital", amount, costNormId: norm.id });
    } else if (norm.cost_type === "recurring" && norm.pct_monthly !== null) {
      const amount = round2((norm.pct_monthly / 100) * projectCost);
      monthlyOperating += amount;
      itemsWithCostNormId.push({ item: norm.item, costType: "recurring", amount, costNormId: norm.id });
    }
  }

  // Assumption: working capital covers one operating cycle of one month. The schema has
  // no category-specific cycle length (e.g. dairy sells daily, tailoring may invoice
  // monthly), so this is a conservative, clearly-labelled default rather than an invented
  // per-category figure.
  const wcCycleMonths = 1;
  const workingCapitalNeed = round2(monthlyOperating * wcCycleMonths);

  assumptions.push(
    "Working capital cycle assumed at 1 month (no category-specific cycle length exists in the database)."
  );
  assumptions.push(
    "Expected monthly revenue and break-even time are not shown — no revenue/sales data exists in the database for a business that hasn't started."
  );

  return {
    capitalExpenditure: round2(capitalExpenditure),
    monthlyOperating: round2(monthlyOperating),
    wcCycleMonths,
    workingCapitalNeed,
    expectedMonthlyRevenue: null,
    breakEvenMonths: null,
    items: itemsWithCostNormId.map(({ costNormId, ...rest }) => rest),
    assumptions,
    itemsWithCostNormId,
  };
}
