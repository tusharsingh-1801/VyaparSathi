import { supabase } from "../config/supabaseClient";
import { resolveLocation } from "../repositories/locationRepository";
import { getLocationSignals } from "../repositories/marketDataRepository";
import { countFieldObservations } from "../repositories/fieldObservationRepository";
import { calculateDataConfidence } from "./dataConfidenceService";
import { MarketIntelligenceResult } from "../types";

export async function getMarketIntelligence(
  locationQuery: string,
  applicantId: string | null
): Promise<MarketIntelligenceResult> {
  const location = await resolveLocation(locationQuery);

  const districtCode = location?.district?.code ?? null;
  const blockCode = location?.block?.code ?? null;
  const villageCode = location?.village?.code ?? null;

  const [signals, districtRow, observationCount] = await Promise.all([
    getLocationSignals({ districtCode, blockCode, villageCode }),
    districtCode
      ? supabase.from("districts").select("annual_growth_rate").eq("lgd_code", districtCode).limit(1)
      : Promise.resolve({ data: [], error: null }),
    applicantId ? countFieldObservations(applicantId) : Promise.resolve(0),
  ]);

  if (districtRow.error) throw districtRow.error;

  const districtGrowthRate = districtRow.data?.[0]?.annual_growth_rate ?? null;

  const confidence = calculateDataConfidence({
    hasDistrict: !!location?.district,
    hasVillageDemographics: !!signals.demographics,
    hasVillageAmenities: !!signals.amenities,
    hasPurchasingPower: !!signals.purchasingPower,
    hasMarketOpportunities: false, // category-agnostic view — this bucket signal is category-specific, left false here
    hasCompetitors: signals.competitors.length > 0,
    hasPriceSignals: signals.priceSignals.length > 0,
    hasEnterpriseCounts: signals.enterpriseCounts.length > 0,
    fieldObservationCount: observationCount,
    hasCostNorms: false, // category-specific — not applicable to a location-only view
    hasRiskData: false,
  });

  return {
    locationResolved: !!location,
    location,
    demographics: signals.demographics,
    amenities: signals.amenities,
    purchasingPower: signals.purchasingPower,
    priceSignals: signals.priceSignals,
    enterpriseCounts: signals.enterpriseCounts,
    competitors: signals.competitors,
    districtGrowthRate,
    confidence,
  };
}
