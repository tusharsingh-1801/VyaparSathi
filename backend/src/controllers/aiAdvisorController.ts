import { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { AdvisorContext, chatWithAdvisor, generateProactiveInsight } from "../services/aiAdvisorService";
import { getApplicant } from "../repositories/applicantRepository";
import { listReportsForApplicant } from "../repositories/reportRepository";
import { getVillagePath } from "../repositories/locationRepository";
import { findBusinessCategory } from "../repositories/businessCategoryRepository";
import { SarvamChatMessage } from "../services/sarvamService";

interface ChatBody {
  applicantId?: string;
  message?: string;
  history?: SarvamChatMessage[];
  pageContext?: string;
}

async function buildContext(applicantId: string | undefined, pageContext: string | undefined): Promise<AdvisorContext> {
  if (!applicantId) return pageContext ? { pageContext } : {};

  const [applicant, reports] = await Promise.all([
    getApplicant(applicantId),
    listReportsForApplicant(applicantId),
  ]);

  const [villagePath, category] = await Promise.all([
    applicant ? getVillagePath(applicant.village_code) : Promise.resolve(null),
    applicant ? findBusinessCategory(applicant.category_id) : Promise.resolve(null),
  ]);

  return {
    applicant,
    villagePath,
    categoryName: category?.name,
    latestReport: reports[0] ?? null,
    pageContext,
  };
}

export async function chat(req: Request, res: Response) {
  const body = (req.body ?? {}) as ChatBody;

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    throw new AppError('"message" is required.', 400);
  }

  const history: SarvamChatMessage[] = Array.isArray(body.history) ? body.history : [];
  const context = await buildContext(body.applicantId, body.pageContext);

  const reply = await chatWithAdvisor([...history, { role: "user", content: body.message }], context);

  res.json({ success: true, reply });
}

export async function insight(req: Request, res: Response) {
  const applicantId = typeof req.query.applicantId === "string" ? req.query.applicantId : undefined;
  const pageContext = typeof req.query.pageContext === "string" ? req.query.pageContext : undefined;

  if (!applicantId && !pageContext) {
    // Nothing to reason from — the frontend shouldn't call this without at least one.
    throw new AppError("No profile or page context available for a proactive insight.", 400);
  }

  const context = await buildContext(applicantId, pageContext);
  const reply = await generateProactiveInsight(context);

  res.json({ success: true, reply });
}
