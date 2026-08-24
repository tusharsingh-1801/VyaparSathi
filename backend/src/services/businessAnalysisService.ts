import { findBusinessCategory } from "../repositories/businessCategoryRepository";
import { resolveLocation } from "../repositories/locationRepository";
import { getMarketDataBundle } from "../repositories/marketDataRepository";
import { getActiveSchemes } from "../repositories/schemeRepository";
import { getApplicant } from "../repositories/applicantRepository";
import { saveReport } from "../repositories/reportRepository";
import {
  getRepaymentSchedule,
  getWorkingCapitalPlan,
  saveRepaymentSchedule,
  saveWorkingCapitalPlan,
} from "../repositories/financialPlanningRepository";
import { calculateFinancials } from "./financialService";
import { generateBusinessAnalysis } from "./sarvamService";
import { calculateWorkingCapitalPlan } from "./workingCapitalService";
import { generateRepaymentSchedule } from "./repaymentScheduleService";
import { extractErrorMessage } from "../utils/errorMessage";
import { AnalyzeRequestBody } from "../types";

export async function analyzeBusiness(input: AnalyzeRequestBody, applicantId?: string) {
  const [schemes, category, location, applicant] = await Promise.all([
    getActiveSchemes(),
    findBusinessCategory(input.businessCategory),
    resolveLocation(input.location),
    applicantId ? getApplicant(applicantId) : Promise.resolve(null),
  ]);

  // Financial calculations never depend on location/category lookups succeeding —
  // they are always computable and always deterministic.
  const financial = calculateFinancials(input.availableMarginCapital, schemes);

  const marketData = await getMarketDataBundle({
    categoryId: category?.id ?? null,
    districtCode: location?.district?.code ?? null,
    blockCode: location?.block?.code ?? null,
    villageCode: location?.village?.code ?? null,
  });

  const aiContext = {
    input,
    location: location
      ? {
          matchedLevel: location.matchedLevel,
          matchedName: location.matchedName,
          state: location.state,
          district: location.district,
          block: location.block,
          village: location.village,
        }
      : { found: false, note: "This location was not found in the database." },
    businessCategory: category
      ? {
          id: category.id,
          name: category.name,
          isSeasonal: category.is_seasonal,
          typicalMarginPct: category.typical_margin_pct,
          nicCodes: category.nic_codes,
        }
      : { found: false, note: "This business category was not found in the database." },
    // Explicitly authoritative — the system prompt tells the model never to alter these.
    financial,
    marketData,
  };

  let aiAnalysis;
  let aiError: string | null = null;
  try {
    aiAnalysis = await generateBusinessAnalysis(aiContext);
  } catch (err) {
    // The deterministic parts of the response (financial + marketData) are still
    // trustworthy and useful even if the AI call fails, so we degrade gracefully
    // instead of failing the whole request.
    aiError = err instanceof Error ? err.message : "Unknown AI error.";
    aiAnalysis = null;
  }

  // Only persist when we have a real applicant to attach the report to AND a scheme
  // actually applies (reports.scheme_id is NOT NULL — nothing to save otherwise).
  let savedReportId: string | null = null;
  let saveError: string | null = null;
  let workingCapitalPlan = null;
  let repaymentSchedule: ReturnType<typeof generateRepaymentSchedule> = [];

  if (applicant && financial.scheme) {
    try {
      const langCode = applicant.preferred_language || "en";
      const { report, isNew } = await saveReport({
        applicantId: applicant.id,
        input,
        financial,
        aiAnalysis,
        risks: marketData.risks,
        langCode,
      });
      savedReportId = report.id;

      if (isNew) {
        const wcCalc = calculateWorkingCapitalPlan(financial.projectCost, marketData.costNorms);
        workingCapitalPlan = { reportId: report.id, ...wcCalc };
        await saveWorkingCapitalPlan(report.id, wcCalc, wcCalc.itemsWithCostNormId);

        repaymentSchedule = generateRepaymentSchedule({
          loanAmount: financial.loanAmount!,
          annualInterestRatePct: financial.scheme.interestRate,
          tenureYears: financial.scheme.tenureYears,
          moratoriumMonths: financial.scheme.moratoriumMonths,
          repaymentFrequency: financial.scheme.repaymentFrequency,
        });
        await saveRepaymentSchedule(report.id, repaymentSchedule);
      } else {
        // Identical input was already analyzed before (reports.input_hash is unique) —
        // reuse its saved financial planning data instead of writing duplicates.
        const [existingPlan, existingSchedule] = await Promise.all([
          getWorkingCapitalPlan(report.id),
          getRepaymentSchedule(report.id),
        ]);
        workingCapitalPlan = existingPlan;
        repaymentSchedule = existingSchedule as typeof repaymentSchedule;
      }
    } catch (err) {
      // Saving is a bonus, not the point of the endpoint — a DB write failure shouldn't
      // hide an otherwise-successful analysis from the caller.
      saveError = extractErrorMessage(err);
      console.error("[businessAnalysisService] failed to save report:", err);
    }
  }

  return {
    success: true,
    input,
    locationResolved: !!location,
    location,
    categoryResolved: !!category,
    financial,
    marketData,
    aiAnalysis,
    aiError,
    savedReportId,
    saveError,
    workingCapitalPlan,
    repaymentSchedule,
  };
}
