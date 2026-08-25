import { AdvisorContext } from "./aiAdvisorService";
import { getApplicant } from "../repositories/applicantRepository";
import { listReportsForApplicant } from "../repositories/reportRepository";
import { getVillagePath } from "../repositories/locationRepository";
import { findBusinessCategory } from "../repositories/businessCategoryRepository";

// Shared by any LLM feature that needs to ground its prompt in the applicant's real
// profile/report data (AI Advisor, Stress Simulator) — one implementation instead of
// each controller re-fetching and re-assembling the same context shape.
export async function buildApplicantContext(
  applicantId: string | undefined,
  pageContext: string | undefined
): Promise<AdvisorContext> {
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
