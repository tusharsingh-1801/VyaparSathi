import { supabase } from "../config/supabaseClient";
import { LocationMatchLevel, ResolvedLocation } from "../types";

// The DB models location as a strict hierarchy: states -> districts -> blocks -> villages,
// all keyed by LGD (Local Government Directory) codes. A user might type a village, block,
// or district name, so we try each level from most to least specific and return the first hit
// together with its full parent chain (needed to scope market-data queries later).

export async function resolveLocation(query: string): Promise<ResolvedLocation | null> {
  const pattern = `%${query.trim()}%`;

  // 1. Try village name first (most specific).
  const { data: villageRows, error: villageErr } = await supabase
    .from("villages")
    .select(
      "lgd_code,name,name_hi,block_code,blocks(lgd_code,name,name_hi,district_code,districts(lgd_code,name,name_hi,state_code,states(lgd_code,name,name_hi)))"
    )
    .ilike("name", pattern)
    .limit(1);

  if (villageErr) throw villageErr;

  if (villageRows && villageRows.length > 0) {
    const v = villageRows[0] as any;
    const block = v.blocks;
    const district = block?.districts;
    const state = district?.states;
    return {
      matchedLevel: "village",
      matchedName: v.name,
      village: { code: v.lgd_code, name: v.name },
      block: block ? { code: block.lgd_code, name: block.name } : null,
      district: district ? { code: district.lgd_code, name: district.name } : null,
      state: state ? { code: state.lgd_code, name: state.name } : null,
    };
  }

  // 2. Fall back to block name.
  const { data: blockRows, error: blockErr } = await supabase
    .from("blocks")
    .select(
      "lgd_code,name,name_hi,district_code,districts(lgd_code,name,name_hi,state_code,states(lgd_code,name,name_hi))"
    )
    .ilike("name", pattern)
    .limit(1);

  if (blockErr) throw blockErr;

  if (blockRows && blockRows.length > 0) {
    const b = blockRows[0] as any;
    const district = b.districts;
    const state = district?.states;
    return {
      matchedLevel: "block",
      matchedName: b.name,
      village: null,
      block: { code: b.lgd_code, name: b.name },
      district: district ? { code: district.lgd_code, name: district.name } : null,
      state: state ? { code: state.lgd_code, name: state.name } : null,
    };
  }

  // 3. Fall back to district name.
  const { data: districtRows, error: districtErr } = await supabase
    .from("districts")
    .select("lgd_code,name,name_hi,state_code,states(lgd_code,name,name_hi)")
    .ilike("name", pattern)
    .limit(1);

  if (districtErr) throw districtErr;

  if (districtRows && districtRows.length > 0) {
    const d = districtRows[0] as any;
    const state = d.states;
    return {
      matchedLevel: "district",
      matchedName: d.name,
      village: null,
      block: null,
      district: { code: d.lgd_code, name: d.name },
      state: state ? { code: state.lgd_code, name: state.name } : null,
    };
  }

  // 4. Fall back to state name.
  const { data: stateRows, error: stateErr } = await supabase
    .from("states")
    .select("lgd_code,name,name_hi")
    .ilike("name", pattern)
    .limit(1);

  if (stateErr) throw stateErr;

  if (stateRows && stateRows.length > 0) {
    const s = stateRows[0];
    return {
      matchedLevel: "state",
      matchedName: s.name,
      village: null,
      block: null,
      district: null,
      state: { code: s.lgd_code, name: s.name },
    };
  }

  // Nothing matched at any level — the caller decides how to degrade gracefully.
  return null;
}

export interface LocationSuggestion {
  level: LocationMatchLevel;
  name: string;
  path: string; // e.g. "Para, Harchandpur, Rae Bareli, Uttar Pradesh"
}

// Powers a type-ahead search box on the frontend so users pick a real, DB-backed
// place name instead of free-typing something that won't resolve to any data.
export async function searchLocations(query: string, limit = 8): Promise<LocationSuggestion[]> {
  const pattern = `%${query.trim()}%`;
  if (query.trim().length < 2) return [];

  const [villages, blocks, districts] = await Promise.all([
    supabase
      .from("villages")
      .select("name,blocks(name,districts(name,states(name)))")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("blocks")
      .select("name,districts(name,states(name))")
      .ilike("name", pattern)
      .limit(limit),
    supabase
      .from("districts")
      .select("name,states(name)")
      .ilike("name", pattern)
      .limit(limit),
  ]);

  if (villages.error) throw villages.error;
  if (blocks.error) throw blocks.error;
  if (districts.error) throw districts.error;

  const suggestions: LocationSuggestion[] = [];

  for (const v of (villages.data ?? []) as any[]) {
    const block = v.blocks;
    const district = block?.districts;
    const state = district?.states;
    suggestions.push({
      level: "village",
      name: v.name,
      path: [v.name, block?.name, district?.name, state?.name].filter(Boolean).join(", "),
    });
  }

  for (const b of (blocks.data ?? []) as any[]) {
    const district = b.districts;
    const state = district?.states;
    suggestions.push({
      level: "block",
      name: b.name,
      path: [b.name, district?.name, state?.name].filter(Boolean).join(", "),
    });
  }

  for (const d of (districts.data ?? []) as any[]) {
    const state = d.states;
    suggestions.push({
      level: "district",
      name: d.name,
      path: [d.name, state?.name].filter(Boolean).join(", "),
    });
  }

  return suggestions.slice(0, limit);
}
