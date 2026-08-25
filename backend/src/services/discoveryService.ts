import { supabase } from "../config/supabaseClient";
import { listCategories } from "../repositories/businessCategoryRepository";
import { calculateOpportunityScore } from "./opportunityScoreService";
import { OpportunityScoreResult, RiskApplicabilityRow } from "../types";

/**
 * Ranks every business category for a given location using the full 6-sub-score
 * Opportunity Score engine (see opportunityScoreService.ts). Every signal is fetched
 * directly from the DB per category; nothing here is invented.
 *
 * Not persisted to business_recommendations: that table requires a NOT NULL report_id,
 * and a report is scoped to one category's financial numbers — there's no clean report
 * to attach a whole-category-list ranking to without inventing one. This is computed
 * fresh on each request instead.
 */
export async function getCategoryRecommendations(params: {
  districtCode: number | null;
  blockCode: number | null;
  villageCode: number | null;
}): Promise<OpportunityScoreResult[]> {
  const categories = await listCategories();
  if (categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);
  const { districtCode, blockCode, villageCode } = params;

  const [opportunities, enterpriseCounts, districtRow, amenitiesRow, purchasingPowerRow, risks] =
    await Promise.all([
      blockCode
        ? supabase
            .from("market_opportunities")
            .select("category_id,gap_score")
            .eq("block_code", blockCode)
            .in("category_id", categoryIds)
        : Promise.resolve({ data: [], error: null }),

      districtCode
        ? supabase
            .from("enterprise_counts")
            .select("category_id,unit_count")
            .eq("admin_level", "district")
            .eq("admin_code", districtCode)
            .in("category_id", categoryIds)
        : Promise.resolve({ data: [], error: null }),

      districtCode
        ? supabase.from("districts").select("annual_growth_rate").eq("lgd_code", districtCode).limit(1)
        : Promise.resolve({ data: [], error: null }),

      villageCode
        ? supabase
            .from("village_amenities")
            .select("has_mandi,nearest_town_km")
            .eq("village_code", villageCode)
            .order("census_year", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),

      districtCode
        ? supabase
            .from("purchasing_power")
            .select("affordability_index")
            .eq("district_code", districtCode)
            .order("as_of_year", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),

      supabase
        .from("risk_applicability")
        .select("*")
        .in("category_id", categoryIds)
        .or(districtCode ? `district_code.is.null,district_code.eq.${districtCode}` : "district_code.is.null"),
    ]);

  if (opportunities.error) throw opportunities.error;
  if (enterpriseCounts.error) throw enterpriseCounts.error;
  if (districtRow.error) throw districtRow.error;
  if (amenitiesRow.error) throw amenitiesRow.error;
  if (purchasingPowerRow.error) throw purchasingPowerRow.error;
  if (risks.error) throw risks.error;

  const demandByCategory = new Map<string, number[]>();
  for (const row of opportunities.data ?? []) {
    const list = demandByCategory.get(row.category_id) ?? [];
    list.push(row.gap_score);
    demandByCategory.set(row.category_id, list);
  }

  const saturationByCategory = new Map<string, number>();
  for (const row of enterpriseCounts.data ?? []) {
    saturationByCategory.set(row.category_id, row.unit_count);
  }

  const risksByCategory = new Map<string, RiskApplicabilityRow[]>();
  for (const row of (risks.data ?? []) as RiskApplicabilityRow[]) {
    if (!row.category_id) continue;
    const list = risksByCategory.get(row.category_id) ?? [];
    list.push(row);
    risksByCategory.set(row.category_id, list);
  }

  const districtGrowthRate = districtRow.data?.[0]?.annual_growth_rate ?? null;
  const amenities = amenitiesRow.data?.[0] ?? null;
  const affordabilityIndex = purchasingPowerRow.data?.[0]?.affordability_index ?? null;

  const results = categories.map((cat) => {
    const demandScores = demandByCategory.get(cat.id);
    const marketOpportunityGapScore = demandScores
      ? demandScores.reduce((a, b) => a + b, 0) / demandScores.length
      : null;
    const enterpriseUnitCount = saturationByCategory.get(cat.id) ?? null;

    return calculateOpportunityScore({
      category: cat,
      marketOpportunityGapScore,
      enterpriseUnitCount,
      districtAnnualGrowthRate: districtGrowthRate,
      purchasingPowerAffordabilityIndex: affordabilityIndex,
      hasMandi: amenities?.has_mandi ?? null,
      nearestTownKm: amenities?.nearest_town_km ?? null,
      categoryRisks: risksByCategory.get(cat.id) ?? [],
    });
  });

  results.sort((a, b) => {
    if (a.overallScore === null && b.overallScore === null) return 0;
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return b.overallScore - a.overallScore;
  });
  results.forEach((r, i) => (r.rank = i + 1));

  return results;
}
