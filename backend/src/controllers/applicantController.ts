import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getVillagePath, resolveVillageByName } from "../repositories/locationRepository";
import { findBusinessCategory } from "../repositories/businessCategoryRepository";
import { createApplicant, getApplicant, updateApplicant } from "../repositories/applicantRepository";

interface ProfilePayload {
  name?: string;
  villageName?: string;
  categoryId?: string;
  marginCapital?: number;
  socialCategory?: string | null;
  expectedMonthlyIncome?: number | null;
  preferredLanguage?: string;
}

async function resolveProfileFields(body: ProfilePayload) {
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw new AppError('"name" is required.', 400);
  }
  if (!body.villageName || typeof body.villageName !== "string") {
    throw new AppError('"villageName" is required.', 400);
  }
  if (!body.categoryId || typeof body.categoryId !== "string") {
    throw new AppError('"categoryId" is required.', 400);
  }
  if (typeof body.marginCapital !== "number" || !Number.isFinite(body.marginCapital) || body.marginCapital <= 0) {
    throw new AppError('"marginCapital" is required and must be a positive number.', 400);
  }

  const [village, category] = await Promise.all([
    resolveVillageByName(body.villageName),
    findBusinessCategory(body.categoryId),
  ]);

  if (!village) {
    throw new AppError(
      `"${body.villageName}" could not be matched to an exact village in the database. Business profiles require a specific village (not just a block or district) — pick one from the location search suggestions.`,
      400
    );
  }
  if (!category) {
    throw new AppError(`"${body.categoryId}" is not a known business category.`, 400);
  }

  return {
    name: body.name.trim(),
    villageCode: village.code,
    categoryId: category.id,
    marginCapital: body.marginCapital,
    socialCategory: body.socialCategory ?? null,
    expectedMonthlyIncome: body.expectedMonthlyIncome ?? null,
    preferredLanguage: body.preferredLanguage || "en",
  };
}

export async function create(req: Request, res: Response) {
  const fields = await resolveProfileFields(req.body ?? {});
  const applicant = await createApplicant(fields);
  const villagePath = await getVillagePath(applicant.village_code);
  res.status(201).json({ success: true, applicant, villagePath });
}

export async function getOne(req: Request, res: Response) {
  const applicant = await getApplicant(req.params.id);
  if (!applicant) {
    throw new AppError("Business profile not found.", 404);
  }
  const villagePath = await getVillagePath(applicant.village_code);
  res.json({ success: true, applicant, villagePath });
}

export async function update(req: Request, res: Response) {
  const existing = await getApplicant(req.params.id);
  if (!existing) {
    throw new AppError("Business profile not found.", 404);
  }

  const body = req.body ?? {};
  const patch: Parameters<typeof updateApplicant>[1] = {};

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      throw new AppError('"name" must be a non-empty string.', 400);
    }
    patch.name = body.name.trim();
  }
  if (body.villageName) {
    const village = await resolveVillageByName(body.villageName);
    if (!village) throw new AppError(`"${body.villageName}" could not be matched to an exact village.`, 400);
    patch.villageCode = village.code;
  }
  if (body.categoryId) {
    const category = await findBusinessCategory(body.categoryId);
    if (!category) throw new AppError(`"${body.categoryId}" is not a known business category.`, 400);
    patch.categoryId = category.id;
  }
  if (body.marginCapital !== undefined) patch.marginCapital = body.marginCapital;
  if (body.socialCategory !== undefined) patch.socialCategory = body.socialCategory;
  if (body.expectedMonthlyIncome !== undefined) patch.expectedMonthlyIncome = body.expectedMonthlyIncome;
  if (body.preferredLanguage !== undefined) patch.preferredLanguage = body.preferredLanguage;

  const applicant = await updateApplicant(req.params.id, patch);
  const villagePath = await getVillagePath(applicant.village_code);
  res.json({ success: true, applicant, villagePath });
}
