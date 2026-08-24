import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getReport, listReportsForApplicant } from "../repositories/reportRepository";
import { getRepaymentSchedule, getWorkingCapitalPlan } from "../repositories/financialPlanningRepository";

export async function list(req: Request, res: Response) {
  const applicantId = typeof req.query.applicantId === "string" ? req.query.applicantId : "";
  if (!applicantId) {
    throw new AppError('"applicantId" query parameter is required.', 400);
  }
  const reports = await listReportsForApplicant(applicantId);
  res.json({ success: true, reports });
}

export async function getOne(req: Request, res: Response) {
  const report = await getReport(req.params.id);
  if (!report) {
    throw new AppError("Report not found.", 404);
  }

  const [workingCapital, repaymentSchedule] = await Promise.all([
    getWorkingCapitalPlan(report.id),
    getRepaymentSchedule(report.id),
  ]);

  res.json({ success: true, report, workingCapital, repaymentSchedule });
}
