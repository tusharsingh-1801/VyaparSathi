import { supabase } from "../config/supabaseClient";
import { FieldObservationRow } from "../types";

export async function saveFieldObservations(
  applicantId: string,
  locationCode: number | null,
  answers: Array<{ questionKey: string; questionText: string; answer: string }>
): Promise<FieldObservationRow[]> {
  if (answers.length === 0) return [];

  const { data, error } = await supabase
    .from("field_observations")
    .insert(
      answers.map((a) => ({
        applicant_id: applicantId,
        location_code: locationCode,
        question_key: a.questionKey,
        question_text: a.questionText,
        answer: a.answer,
      }))
    )
    .select("*");

  if (error) throw error;
  return (data ?? []) as FieldObservationRow[];
}

export async function listFieldObservations(applicantId: string): Promise<FieldObservationRow[]> {
  const { data, error } = await supabase
    .from("field_observations")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("submitted_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FieldObservationRow[];
}

export async function countFieldObservations(applicantId: string): Promise<number> {
  const { count, error } = await supabase
    .from("field_observations")
    .select("*", { count: "exact", head: true })
    .eq("applicant_id", applicantId);

  if (error) throw error;
  return count ?? 0;
}
