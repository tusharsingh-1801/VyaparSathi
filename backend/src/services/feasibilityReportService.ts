import { AppError } from "../utils/AppError";
import { getApplicant } from "../repositories/applicantRepository";
import { findBusinessCategory } from "../repositories/businessCategoryRepository";
import { getVillagePath, resolveLocation } from "../repositories/locationRepository";
import { getMarketDataBundle } from "../repositories/marketDataRepository";
import { getActiveSchemes } from "../repositories/schemeRepository";
import { listReportsForApplicant } from "../repositories/reportRepository";
import { saveFeasibilityReport } from "../repositories/feasibilityReportRepository";
import { calculateFinancials } from "./financialService";
import { FEASIBILITY_MODEL, generateFeasibilityAnalysis } from "./sarvamService";
import { FeasibilityReportRow } from "../types";

// Reuses the same input-gathering as businessAnalysisService.analyzeBusiness (schemes,
// category, location, market data), but sourced from the applicant's own saved profile
// instead of a fresh form submission — a feasibility report always answers "is MY current
// business plan viable", not a hypothetical one.
export async function generateFeasibilityReport(applicantId: string): Promise<FeasibilityReportRow> {
  const applicant = await getApplicant(applicantId);
  if (!applicant) {
    throw new AppError("Business profile not found.", 404);
  }

  const [villagePath, category, schemes, latestReports] = await Promise.all([
    getVillagePath(applicant.village_code),
    findBusinessCategory(applicant.category_id),
    getActiveSchemes(),
    listReportsForApplicant(applicantId),
  ]);

  const location = villagePath ? await resolveLocation(villagePath.split(",")[0].trim()) : null;
  const financial = calculateFinancials(applicant.margin_capital, schemes);

  const marketData = await getMarketDataBundle({
    categoryId: category?.id ?? null,
    districtCode: location?.district?.code ?? null,
    blockCode: location?.block?.code ?? null,
    villageCode: applicant.village_code,
  });

  const latestReport = latestReports[0] ?? null;

  const context = {
    applicantProfile: {
      villagePath,
      businessCategory: category
        ? { id: category.id, name: category.name, isSeasonal: category.is_seasonal, typicalMarginPct: category.typical_margin_pct }
        : { found: false, note: "This business category was not found in the database." },
      marginCapital: applicant.margin_capital,
      socialCategory: applicant.social_category,
      expectedMonthlyIncome: applicant.expected_monthly_income,
    },
    financial,
    marketData,
    // Real, verified numbers from their most recent saved analysis, if any — grounds the
    // financial section in an actual computed loan/EMI instead of just margin capital.
    latestSavedAnalysis: latestReport
      ? { numbers: latestReport.numbers, priorAiSummary: latestReport.narrative?.summary ?? null }
      : { found: false, note: "No saved analysis yet for this applicant." },
  };

  const analysis = await generateFeasibilityAnalysis(context);

  return saveFeasibilityReport({
    applicantId,
    input: {
      location: villagePath ?? "",
      businessCategory: category?.id ?? applicant.category_id,
      marginCapital: applicant.margin_capital,
    },
    analysis,
    llmModel: FEASIBILITY_MODEL,
  });
}
