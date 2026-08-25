import { DataConfidenceBucket, DataConfidenceResult } from "../types";

// Deterministic, transparent confidence score — never LLM-generated. Each bucket's
// contribution is populatedSignals/possibleSignals * bucket weight; weights sum to 100.
const WEIGHTS = {
  governmentData: 40,
  marketData: 25,
  userObservations: 15,
  estimatedIndicators: 20,
};

function makeBucket(label: string, weight: number, populated: number, possible: number): DataConfidenceBucket {
  const ratio = possible > 0 ? Math.min(populated / possible, 1) : 0;
  return {
    label,
    weight,
    populatedSignals: populated,
    possibleSignals: possible,
    contribution: Math.round(ratio * weight * 10) / 10,
  };
}

export interface DataConfidenceSignals {
  // Government data (possible = 4): district resolved (growth rate always present once a
  // district row exists), village demographics, village amenities, purchasing power.
  hasDistrict: boolean;
  hasVillageDemographics: boolean;
  hasVillageAmenities: boolean;
  hasPurchasingPower: boolean;
  // Market data (possible = 4)
  hasMarketOpportunities: boolean;
  hasCompetitors: boolean;
  hasPriceSignals: boolean;
  hasEnterpriseCounts: boolean;
  // User observations — target of 3 submitted observations for full credit
  fieldObservationCount: number;
  // Estimated indicators (possible = 2)
  hasCostNorms: boolean;
  hasRiskData: boolean;
}

export function calculateDataConfidence(signals: DataConfidenceSignals): DataConfidenceResult {
  const governmentData = makeBucket(
    "Government data",
    WEIGHTS.governmentData,
    [signals.hasDistrict, signals.hasVillageDemographics, signals.hasVillageAmenities, signals.hasPurchasingPower].filter(
      Boolean
    ).length,
    4
  );

  const marketData = makeBucket(
    "Market data",
    WEIGHTS.marketData,
    [
      signals.hasMarketOpportunities,
      signals.hasCompetitors,
      signals.hasPriceSignals,
      signals.hasEnterpriseCounts,
    ].filter(Boolean).length,
    4
  );

  const OBSERVATION_TARGET = 3;
  const userObservations = makeBucket(
    "User observations",
    WEIGHTS.userObservations,
    Math.min(signals.fieldObservationCount, OBSERVATION_TARGET),
    OBSERVATION_TARGET
  );

  const estimatedIndicators = makeBucket(
    "Estimated indicators",
    WEIGHTS.estimatedIndicators,
    [signals.hasCostNorms, signals.hasRiskData].filter(Boolean).length,
    2
  );

  const overallPct = Math.round(
    governmentData.contribution +
      marketData.contribution +
      userObservations.contribution +
      estimatedIndicators.contribution
  );

  return {
    overallPct,
    buckets: { governmentData, marketData, userObservations, estimatedIndicators },
  };
}
