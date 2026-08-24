import { Request, Response } from "express";
import { analyzeBusiness } from "../services/businessAnalysisService";
import { AnalyzeRequestBody } from "../types";

export async function analyze(req: Request, res: Response) {
  const body = req.body as AnalyzeRequestBody;
  const result = await analyzeBusiness(body);
  res.json(result);
}
