import { findBusinessCategory } from "../repositories/businessCategoryRepository";
import { resolveLocation } from "../repositories/locationRepository";
import { getMarketDataBundle } from "../repositories/marketDataRepository";
import { getActiveSchemes } from "../repositories/schemeRepository";
import { calculateFinancials } from "./financialService";
import { generateBusinessAnalysis } from "./sarvamService";
import { AnalyzeRequestBody } from "../types";

export async function analyzeBusiness(input: AnalyzeRequestBody) {
  const [schemes, category, location] = await Promise.all([
    getActiveSchemes(),
    findBusinessCategory(input.businessCategory),
    resolveLocation(input.location),
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
  };
}
