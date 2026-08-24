import { supabase } from "../config/supabaseClient";
import { RepaymentPeriod, WorkingCapitalItem, WorkingCapitalPlan } from "../types";

export async function saveWorkingCapitalPlan(
  reportId: string,
  plan: Omit<WorkingCapitalPlan, "reportId">,
  itemsWithCostNormId: Array<WorkingCapitalItem & { costNormId: number }>
): Promise<void> {
  const { error: planError } = await supabase.from("working_capital_plans").insert({
    report_id: reportId,
    capital_expenditure: plan.capitalExpenditure,
    monthly_operating: plan.monthlyOperating,
    wc_cycle_months: plan.wcCycleMonths,
    working_capital_need: plan.workingCapitalNeed,
    expected_monthly_revenue: plan.expectedMonthlyRevenue,
    break_even_months: plan.breakEvenMonths,
    computed_at: new Date().toISOString(),
  });
  if (planError) throw planError;

  if (itemsWithCostNormId.length === 0) return;

  const { error: itemsError } = await supabase.from("working_capital_items").insert(
    itemsWithCostNormId.map((item) => ({
      report_id: reportId,
      cost_norm_id: item.costNormId,
      item: item.item,
      cost_type: item.costType,
      amount: item.amount,
    }))
  );
  if (itemsError) throw itemsError;
}

export async function getWorkingCapitalPlan(reportId: string): Promise<{
  plan: Record<string, unknown>;
  items: unknown[];
} | null> {
  const [planRes, itemsRes] = await Promise.all([
    supabase.from("working_capital_plans").select("*").eq("report_id", reportId).limit(1),
    supabase.from("working_capital_items").select("*").eq("report_id", reportId),
  ]);
  if (planRes.error) throw planRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (!planRes.data || planRes.data.length === 0) return null;

  return { plan: planRes.data[0], items: itemsRes.data ?? [] };
}

export async function saveRepaymentSchedule(
  reportId: string,
  periods: RepaymentPeriod[]
): Promise<void> {
  if (periods.length === 0) return;

  const { error } = await supabase.from("repayment_schedule").insert(
    periods.map((p) => ({
      report_id: reportId,
      period_no: p.periodNo,
      period_type: p.periodType,
      phase: p.phase,
      opening_balance: p.openingBalance,
      interest_accrued: p.interestAccrued,
      principal_repaid: p.principalRepaid,
      payment_due: p.paymentDue,
      closing_balance: p.closingBalance,
    }))
  );
  if (error) throw error;
}

export async function getRepaymentSchedule(reportId: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from("repayment_schedule")
    .select("*")
    .eq("report_id", reportId)
    .order("period_no", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
