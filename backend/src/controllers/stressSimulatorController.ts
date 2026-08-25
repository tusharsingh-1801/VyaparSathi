import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  STRESS_SCENARIOS,
  continueStressSession,
  getScenario,
} from "../services/stressSimulatorService";
import { buildApplicantContext } from "../services/applicantContextService";
import { SarvamChatMessage } from "../services/sarvamService";

interface ChatBody {
  scenarioId?: string;
  applicantId?: string;
  history?: SarvamChatMessage[];
  message?: string;
}

export function listScenarios(_req: Request, res: Response) {
  res.json({
    success: true,
    scenarios: STRESS_SCENARIOS.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      openingLine: s.openingLine,
    })),
  });
}

export async function chat(req: Request, res: Response) {
  const body = (req.body ?? {}) as ChatBody;

  if (!body.scenarioId || typeof body.scenarioId !== "string") {
    throw new AppError('"scenarioId" is required.', 400);
  }
  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    throw new AppError(`Unknown scenario "${body.scenarioId}".`, 400);
  }
  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    throw new AppError('"message" is required.', 400);
  }

  const history: SarvamChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const context = await buildApplicantContext(body.applicantId, undefined);

  const reply = await continueStressSession(
    scenario,
    [...history, { role: "user", content: body.message }],
    context
  );

  res.json({ success: true, reply });
}
