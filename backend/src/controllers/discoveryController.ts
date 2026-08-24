import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { resolveLocation } from "../repositories/locationRepository";
import { getCategoryRecommendations } from "../services/discoveryService";
import { getActiveSchemes } from "../repositories/schemeRepository";

export async function recommendations(req: Request, res: Response) {
  const location = typeof req.query.location === "string" ? req.query.location : "";
  if (!location) {
    throw new AppError('"location" query parameter is required.', 400);
  }

  const resolved = await resolveLocation(location);
  const recs = await getCategoryRecommendations({
    districtCode: resolved?.district?.code ?? null,
    blockCode: resolved?.block?.code ?? null,
  });

  res.json({ success: true, locationResolved: !!resolved, location: resolved, recommendations: recs });
}

export async function schemes(_req: Request, res: Response) {
  const activeSchemes = await getActiveSchemes();
  res.json({ success: true, schemes: activeSchemes });
}
