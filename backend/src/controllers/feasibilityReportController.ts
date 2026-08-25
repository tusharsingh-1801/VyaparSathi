import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { generateFeasibilityReport } from "../services/feasibilityReportService";
import { getFeasibilityReport, listFeasibilityReportsForApplicant } from "../repositories/feasibilityReportRepository";

export async function generate(req: Request, res: Response) {
  const applicantId = req.body?.applicantId;
  if (!applicantId || typeof applicantId !== "string") {
    throw new AppError('"applicantId" is required.', 400);
  }
  const report = await generateFeasibilityReport(applicantId);
  res.status(201).json({ success: true, report });
}

export async function list(req: Request, res: Response) {
  const applicantId = typeof req.query.applicantId === "string" ? req.query.applicantId : undefined;
  if (!applicantId) {
    throw new AppError('"applicantId" query parameter is required.', 400);
  }
  const reports = await listFeasibilityReportsForApplicant(applicantId);
  res.json({ success: true, reports });
}

export async function getOne(req: Request, res: Response) {
  const report = await getFeasibilityReport(req.params.id);
  if (!report) {
    throw new AppError("Feasibility report not found.", 404);
  }
  res.json({ success: true, report });
}
