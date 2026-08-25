import { supabase } from "../config/supabaseClient";
import { ApplicantRow } from "../types";

export async function createApplicant(input: {
  name: string;
  villageCode: number;
  marginCapital: number;
  categoryId: string;
  socialCategory: string | null;
  expectedMonthlyIncome: number | null;
  preferredLanguage: string;
}): Promise<ApplicantRow> {
  const { data, error } = await supabase
    .from("applicants")
    .insert({
      name: input.name,
      village_code: input.villageCode,
      margin_capital: input.marginCapital,
      category_id: input.categoryId,
      social_category: input.socialCategory,
      expected_monthly_income: input.expectedMonthlyIncome,
      preferred_language: input.preferredLanguage,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ApplicantRow;
}

export async function getApplicant(id: string): Promise<ApplicantRow | null> {
  const { data, error } = await supabase.from("applicants").select("*").eq("id", id).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as ApplicantRow) : null;
}

export async function updateApplicant(
  id: string,
  patch: Partial<{
    name: string;
    villageCode: number;
    marginCapital: number;
    categoryId: string;
    socialCategory: string | null;
    expectedMonthlyIncome: number | null;
    preferredLanguage: string;
  }>
): Promise<ApplicantRow> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.villageCode !== undefined) dbPatch.village_code = patch.villageCode;
  if (patch.marginCapital !== undefined) dbPatch.margin_capital = patch.marginCapital;
  if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
  if (patch.socialCategory !== undefined) dbPatch.social_category = patch.socialCategory;
  if (patch.expectedMonthlyIncome !== undefined)
    dbPatch.expected_monthly_income = patch.expectedMonthlyIncome;
  if (patch.preferredLanguage !== undefined) dbPatch.preferred_language = patch.preferredLanguage;

  const { data, error } = await supabase
    .from("applicants")
    .update(dbPatch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ApplicantRow;
}
