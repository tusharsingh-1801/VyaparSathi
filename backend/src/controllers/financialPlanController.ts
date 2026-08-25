import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getActiveSchemes } from "../repositories/schemeRepository";
import { calculateFinancialPlan } from "../services/financialPlanService";

interface PlanBody {
  availableMarginCapital?: number;
  expectedMonthlyRevenue?: number;
  monthlyOperatingExpenses?: number;
}

export async function createPlan(req: Request, res: Response) {
  const body = (req.body ?? {}) as PlanBody;

  if (
    typeof body.availableMarginCapital !== "number" ||
    !Number.isFinite(body.availableMarginCapital) ||
    body.availableMarginCapital <= 0
  ) {
    throw new AppError('"availableMarginCapital" is required and must be a positive number.', 400);
  }
  if (typeof body.expectedMonthlyRevenue !== "number" || !Number.isFinite(body.expectedMonthlyRevenue) || body.expectedMonthlyRevenue < 0) {
    throw new AppError('"expectedMonthlyRevenue" is required and must be a non-negative number.', 400);
  }
  if (
    typeof body.monthlyOperatingExpenses !== "number" ||
    !Number.isFinite(body.monthlyOperatingExpenses) ||
    body.monthlyOperatingExpenses < 0
  ) {
    throw new AppError('"monthlyOperatingExpenses" is required and must be a non-negative number.', 400);
  }

  const schemes = await getActiveSchemes();
  const plan = calculateFinancialPlan(
    body.availableMarginCapital,
    body.expectedMonthlyRevenue,
    body.monthlyOperatingExpenses,
    schemes
  );

  res.json({ success: true, ...plan });
}
