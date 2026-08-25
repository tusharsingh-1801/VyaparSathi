import { BusinessCategoryRow, OpportunityScoreResult, OpportunitySubScore, RiskApplicabilityRow } from "../types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const NA: OpportunitySubScore = { score: null, label: "", explanation: "No data available for this signal." };

function sub(score: number | null, label: string, explanation: string): OpportunitySubScore {
  return { score: score === null ? null : round1(clamp(score, 0, 100)), label, explanation };
}

export interface OpportunityScoreSignals {
  category: BusinessCategoryRow;
  marketOpportunityGapScore: number | null; // avg market_opportunities.gap_score
  enterpriseUnitCount: number | null; // enterprise_counts.unit_count at district/block level
  districtAnnualGrowthRate: number | null; // districts.annual_growth_rate (e.g. 0.0113 = 1.13%)
  purchasingPowerAffordabilityIndex: number | null;
  hasMandi: boolean | null;
  nearestTownKm: number | null;
  categoryRisks: RiskApplicabilityRow[];
}

/**
 * Composite 0-100 Opportunity Score built from 6 sub-scores, each independently null when
 * its underlying signal is missing (never defaulted to 0 or averaged-in as a guess). The
 * overall score is the mean of whichever sub-scores exist. Every scaling factor below is a
 * documented, fixed heuristic applied to real DB values — never an invented number.
 */
export function calculateOpportunityScore(signals: OpportunityScoreSignals): OpportunityScoreResult {
  const { category } = signals;

  // Market Potential: market_opportunities.gap_score is already a 0-100 index in the schema.
  const marketPotential = sub(
    signals.marketOpportunityGapScore,
    "Market Potential",
    signals.marketOpportunityGapScore !== null
      ? `Market opportunity gap score of ${signals.marketOpportunityGapScore} recorded for this category in this block.`
      : "No market opportunity data recorded for this category at this location."
  );

  // Competition ("room to enter"): inverse of existing enterprise count. Same transform
  // used in discoveryService.ts (100/(1+unitCount)) — 0 competitors -> 100, more -> lower.
  const competition = sub(
    signals.enterpriseUnitCount !== null ? 100 / (1 + signals.enterpriseUnitCount) : null,
    "Competition",
    signals.enterpriseUnitCount !== null
      ? `${signals.enterpriseUnitCount} existing registered unit(s) recorded in this district.`
      : "No enterprise count data recorded for this category in this district."
  );

  // Financial Feasibility: the category's own typical operating margin — a higher typical
  // margin means more room to service debt. Linear scale, 40% margin treated as the ceiling.
  const financialFeasibility = sub(
    category.typical_margin_pct !== null ? (category.typical_margin_pct / 40) * 100 : null,
    "Financial Feasibility",
    category.typical_margin_pct !== null
      ? `Typical operating margin for this category is ${category.typical_margin_pct}%.`
      : "No typical margin data recorded for this category."
  );

  // Local Economic Fit: district growth rate (fraction, e.g. 0.0113) scaled so 5% growth = 100,
  // averaged with purchasing power's affordability index when both are present.
  const growthComponent = signals.districtAnnualGrowthRate !== null ? signals.districtAnnualGrowthRate * 2000 : null;
  const affordabilityComponent = signals.purchasingPowerAffordabilityIndex;
  const economicComponents = [growthComponent, affordabilityComponent].filter((v): v is number => v !== null);
  const localEconomicFit = sub(
    economicComponents.length > 0 ? economicComponents.reduce((a, b) => a + b, 0) / economicComponents.length : null,
    "Local Economic Fit",
    economicComponents.length > 0
      ? `Based on ${growthComponent !== null ? `district annual growth rate (${(signals.districtAnnualGrowthRate! * 100).toFixed(2)}%)` : ""}${
          growthComponent !== null && affordabilityComponent !== null ? " and " : ""
        }${affordabilityComponent !== null ? "purchasing power affordability index" : ""}.`
      : "No district growth or purchasing power data available for this location."
  );

  // Supply Availability: proxy signal only (market/input access), not authoritative —
  // nearby mandi presence and distance to the nearest town.
  const mandiComponent = signals.hasMandi !== null ? (signals.hasMandi ? 100 : 40) : null;
  const distanceComponent = signals.nearestTownKm !== null ? clamp(100 - signals.nearestTownKm * 5, 0, 100) : null;
  const supplyComponents = [mandiComponent, distanceComponent].filter((v): v is number => v !== null);
  const supplyAvailability = sub(
    supplyComponents.length > 0 ? supplyComponents.reduce((a, b) => a + b, 0) / supplyComponents.length : null,
    "Supply Availability",
    supplyComponents.length > 0
      ? "Proxy estimate from local mandi presence and distance to nearest town — not a direct supply-chain measurement."
      : "No amenity data available for this village to estimate supply access."
  );

  // Risk: inverted severity count for this category (high -20, medium -10, low -5 from 100).
  const risk =
    signals.categoryRisks.length > 0
      ? sub(
          100 -
            signals.categoryRisks.reduce((total, r) => {
              const penalty = r.severity === "high" ? 20 : r.severity === "medium" ? 10 : 5;
              return total + penalty;
            }, 0),
          "Risk",
          `${signals.categoryRisks.length} known risk factor(s) recorded for this category.`
        )
      : { ...NA, label: "Risk" };

  const subScores = { marketPotential, competition, financialFeasibility, localEconomicFit, supplyAvailability, risk };

  const nonNull = Object.values(subScores)
    .map((s) => s.score)
    .filter((v): v is number => v !== null);
  const overallScore = nonNull.length > 0 ? round1(nonNull.reduce((a, b) => a + b, 0) / nonNull.length) : null;

  return { categoryId: category.id, categoryName: category.name, overallScore, rank: 0, subScores };
}
