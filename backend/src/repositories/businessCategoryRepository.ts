import { supabase } from "../config/supabaseClient";
import { BusinessCategoryRow } from "../types";

// business_categories.id is a human-picked slug (e.g. "dairy", "kirana"), and name/name_hi
// are display labels. Users may type either, in any case, so we try id first, then name.
export async function findBusinessCategory(input: string): Promise<BusinessCategoryRow | null> {
  const normalizedId = input.trim().toLowerCase().replace(/\s+/g, "_");

  const { data: byId, error: idErr } = await supabase
    .from("business_categories")
    .select("*")
    .eq("id", normalizedId)
    .limit(1);

  if (idErr) throw idErr;
  if (byId && byId.length > 0) return byId[0] as BusinessCategoryRow;

  const { data: byName, error: nameErr } = await supabase
    .from("business_categories")
    .select("*")
    .ilike("name", `%${input.trim()}%`)
    .limit(1);

  if (nameErr) throw nameErr;
  if (byName && byName.length > 0) return byName[0] as BusinessCategoryRow;

  return null;
}

// Used by the frontend to render a fixed picker instead of a free-text field.
export async function listCategories(): Promise<BusinessCategoryRow[]> {
  const { data, error } = await supabase
    .from("business_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as BusinessCategoryRow[];
}
