import { Request, Response } from "express";
import { analyzeBusiness } from "../services/businessAnalysisService";
import { AnalyzeRequestBody } from "../types";

export async function analyze(req: Request, res: Response) {
  const { applicantId, ...body } = req.body as AnalyzeRequestBody & { applicantId?: string };
  const result = await analyzeBusiness(body, applicantId);
  res.json(result);
}
