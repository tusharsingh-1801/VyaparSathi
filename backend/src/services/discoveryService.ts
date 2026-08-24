import { supabase } from "../config/supabaseClient";
import { listCategories } from "../repositories/businessCategoryRepository";
import { CategoryRecommendation } from "../types";

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Ranks every business category for a given location using only real signals already in
 * the database:
 *  - demand: average market_opportunities.gap_score for that category in this block
 *  - saturation ("room to enter"): derived from enterprise_counts.unit_count in this
 *    district — fewer existing units scores higher. A simple deterministic transform
 *    (100 / (1 + unit_count)), not a value from the database itself.
 *
 * There is no absolute minimum-investment data per category anywhere in the schema
 * (cost_norms is proportional, not absolute), so a "capital fit" score is deliberately
 * left null rather than invented — disclosed via each category's rationale text.
 *
 * Not persisted to business_recommendations: that table requires a NOT NULL report_id,
 * and a report is scoped to one category's financial numbers — there's no clean report
 * to attach a whole-category-list ranking to without inventing one. This is computed
 * fresh on each request instead.
 */
export async function getCategoryRecommendations(params: {
  districtCode: number | null;
  blockCode: number | null;
}): Promise<CategoryRecommendation[]> {
  const categories = await listCategories();
  if (categories.length === 0) return [];

  const categoryIds = categories.map((c) => c.id);

  const [opportunities, enterpriseCounts] = await Promise.all([
    params.blockCode
      ? supabase
          .from("market_opportunities")
          .select("category_id,gap_score")
          .eq("block_code", params.blockCode)
          .in("category_id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
    params.districtCode
      ? supabase
          .from("enterprise_counts")
          .select("category_id,unit_count")
          .eq("admin_level", "district")
          .eq("admin_code", params.districtCode)
          .in("category_id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (opportunities.error) throw opportunities.error;
  if (enterpriseCounts.error) throw enterpriseCounts.error;

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

  const results: CategoryRecommendation[] = categories.map((cat) => {
    const demandScores = demandByCategory.get(cat.id);
    const demandScore = demandScores ? round1(demandScores.reduce((a, b) => a + b, 0) / demandScores.length) : null;

    const unitCount = saturationByCategory.get(cat.id);
    const saturationScore = unitCount !== undefined ? round1(100 / (1 + unitCount)) : null;

    const signals = [demandScore, saturationScore].filter((s): s is number => s !== null);
    const suitability = signals.length > 0 ? round1(signals.reduce((a, b) => a + b, 0) / signals.length) : null;

    const rationaleParts: string[] = [];
    rationaleParts.push(
      demandScore !== null
        ? `Market opportunity gap score: ${demandScore}.`
        : "No market opportunity data for this category at this location."
    );
    rationaleParts.push(
      saturationScore !== null
        ? `${unitCount} existing registered unit(s) in this district.`
        : "No enterprise count data for this category in this district."
    );
    if (suitability === null) {
      rationaleParts.push("Insufficient data to rank this category.");
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      suitability,
      demandScore,
      saturationScore,
      capitalFitScore: null,
      rationale: rationaleParts.join(" "),
      rank: 0, // assigned after sort, below
    };
  });

  results.sort((a, b) => {
    if (a.suitability === null && b.suitability === null) return 0;
    if (a.suitability === null) return 1;
    if (b.suitability === null) return -1;
    return b.suitability - a.suitability;
  });
  results.forEach((r, i) => (r.rank = i + 1));

  return results;
}
