import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { listFieldObservations, saveFieldObservations } from "../repositories/fieldObservationRepository";

interface SubmitBody {
  applicantId?: string;
  locationCode?: number | null;
  answers?: Array<{ questionKey: string; questionText: string; answer: string }>;
}

export async function submit(req: Request, res: Response) {
  const body = (req.body ?? {}) as SubmitBody;

  if (!body.applicantId || typeof body.applicantId !== "string") {
    throw new AppError('"applicantId" is required.', 400);
  }
  if (!Array.isArray(body.answers) || body.answers.length === 0) {
    throw new AppError('"answers" must be a non-empty array.', 400);
  }
  for (const a of body.answers) {
    if (!a.questionKey || !a.questionText || !a.answer) {
      throw new AppError("Each answer requires questionKey, questionText, and answer.", 400);
    }
  }

  const saved = await saveFieldObservations(body.applicantId, body.locationCode ?? null, body.answers);
  res.status(201).json({ success: true, observations: saved });
}

export async function list(req: Request, res: Response) {
  const applicantId = typeof req.query.applicantId === "string" ? req.query.applicantId : "";
  if (!applicantId) {
    throw new AppError('"applicantId" query parameter is required.', 400);
  }
  const observations = await listFieldObservations(applicantId);
  res.json({ success: true, observations });
}
