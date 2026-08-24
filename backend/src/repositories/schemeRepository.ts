import { supabase } from "../config/supabaseClient";
import { SchemeRow } from "../types";

// Scheme parameters (interest rate, tenure, moratorium, caps) live in the DB, not in code,
// so a scheme change never requires a code deploy. Ordered ascending by min_project_cost so
// the financial engine can pick "the first scheme whose max_project_cost covers this project".
export async function getActiveSchemes(): Promise<SchemeRow[]> {
  const { data, error } = await supabase
    .from("schemes")
    .select("*")
    .eq("is_active", true)
    .order("min_project_cost", { ascending: true });

  if (error) throw error;
  return (data ?? []) as SchemeRow[];
}
