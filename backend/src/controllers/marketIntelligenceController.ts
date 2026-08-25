import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getMarketIntelligence } from "../services/marketIntelligenceService";

export async function getIntelligence(req: Request, res: Response) {
  const location = typeof req.query.location === "string" ? req.query.location : "";
  if (!location) {
    throw new AppError('"location" query parameter is required.', 400);
  }
  const applicantId = typeof req.query.applicantId === "string" ? req.query.applicantId : null;

  const result = await getMarketIntelligence(location, applicantId);
  res.json({ success: true, ...result });
}
