import { supabase } from "../config/supabaseClient";
import { MarketDataBundle } from "../types";

interface MarketDataQuery {
  categoryId: string | null;
  districtCode: number | null;
  blockCode: number | null;
  villageCode: number | null;
}

// Pulls every piece of reference data the DB actually has for this location/category
// combination. None of these tables are guaranteed to have rows for a given place —
// an empty result is a normal, expected outcome, not an error.
export async function getMarketDataBundle(query: MarketDataQuery): Promise<MarketDataBundle> {
  const { categoryId, districtCode, blockCode, villageCode } = query;

  const [
    marketOpportunities,
    competitors,
    purchasingPower,
    priceSignals,
    villageDemographics,
    villageAmenities,
    enterpriseCounts,
    costNorms,
    risks,
    schemeTargets,
  ] = await Promise.all([
    categoryId && blockCode
      ? select("market_opportunities", (q) =>
          q.eq("category_id", categoryId).eq("block_code", blockCode).limit(5)
        )
      : Promise.resolve([]),

    categoryId && (villageCode || blockCode)
      ? select("competitors", (q) => {
          let query = q.eq("category_id", categoryId);
          if (villageCode) query = query.eq("village_code", villageCode);
          else if (blockCode) query = query.eq("block_code", blockCode);
          return query.limit(10);
        })
      : Promise.resolve([]),

    districtCode
      ? selectOne("purchasing_power", (q) =>
          q.eq("district_code", districtCode).order("as_of_year", { ascending: false }).limit(1)
        )
      : Promise.resolve(null),

    districtCode
      ? select("price_signals", (q) =>
          q.eq("district_code", districtCode).order("price_date", { ascending: false }).limit(10)
        )
      : Promise.resolve([]),

    villageCode
      ? selectOne("village_demographics", (q) =>
          q.eq("village_code", villageCode).order("census_year", { ascending: false }).limit(1)
        )
      : Promise.resolve(null),

    villageCode
      ? selectOne("village_amenities", (q) =>
          q.eq("village_code", villageCode).order("census_year", { ascending: false }).limit(1)
        )
      : Promise.resolve(null),

    categoryId && (districtCode || blockCode)
      ? select("enterprise_counts", (q) => {
          const orParts: string[] = [];
          if (districtCode) orParts.push(`and(admin_level.eq.district,admin_code.eq.${districtCode})`);
          if (blockCode) orParts.push(`and(admin_level.eq.block,admin_code.eq.${blockCode})`);
          return q.eq("category_id", categoryId).or(orParts.join(",")).limit(5);
        })
      : Promise.resolve([]),

    categoryId
      ? select("cost_norms", (q) => q.eq("category_id", categoryId).limit(20))
      : Promise.resolve([]),

    categoryId
      ? selectWithColumns(
          "risk_applicability",
          "*,risk_types(name,name_hi,risk_class,description)",
          (q) => q.eq("category_id", categoryId).limit(10)
        )
      : Promise.resolve([]),

    categoryId && districtCode
      ? select("scheme_targets", (q) =>
          q.eq("category_id", categoryId).eq("district_code", districtCode).limit(5)
        )
      : Promise.resolve([]),
  ]);

  const populatedSections = [
    marketOpportunities.length > 0,
    competitors.length > 0,
    !!purchasingPower,
    priceSignals.length > 0,
    !!villageDemographics,
    !!villageAmenities,
    enterpriseCounts.length > 0,
    risks.length > 0,
  ].filter(Boolean).length;

  const dataConfidence: MarketDataBundle["dataConfidence"] =
    populatedSections >= 4 ? "high" : populatedSections >= 1 ? "medium" : "low";

  return {
    dataConfidence,
    marketOpportunities,
    competitors,
    purchasingPower,
    priceSignals,
    villageDemographics,
    villageAmenities,
    enterpriseCounts,
    costNorms,
    risks,
    schemeTargets,
  };
}

// Small helpers to keep the Promise.all block above readable.
async function select<T = unknown>(table: string, build: (q: any) => any): Promise<T[]> {
  return selectWithColumns<T>(table, "*", build);
}

async function selectWithColumns<T = unknown>(
  table: string,
  columns: string,
  build: (q: any) => any
): Promise<T[]> {
  const { data, error } = await build(supabase.from(table).select(columns));
  if (error) throw error;
  return (data ?? []) as T[];
}

async function selectOne<T = unknown>(
  table: string,
  build: (q: any) => any
): Promise<T | null> {
  const rows = await select<T>(table, build);
  return rows.length > 0 ? rows[0] : null;
}
