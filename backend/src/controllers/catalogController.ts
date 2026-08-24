import { Request, Response } from "express";
import { listCategories } from "../repositories/businessCategoryRepository";
import { searchLocations } from "../repositories/locationRepository";

export async function getCategories(_req: Request, res: Response) {
  const categories = await listCategories();
  res.json({ success: true, categories });
}

export async function getLocationSuggestions(req: Request, res: Response) {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  const suggestions = await searchLocations(q);
  res.json({ success: true, suggestions });
}
