import { supabase } from "../config/supabaseClient";
import { FeasibilityAnalysis, FeasibilityReportRow } from "../types";

export async function saveFeasibilityReport(params: {
  applicantId: string;
  input: { location: string; businessCategory: string; marginCapital: number };
  analysis: FeasibilityAnalysis;
  llmModel: string;
}): Promise<FeasibilityReportRow> {
  const { applicantId, input, analysis, llmModel } = params;

  const { data, error } = await supabase
    .from("feasibility_reports")
    .insert({
      applicant_id: applicantId,
      input,
      verdict: analysis.verdict,
      confidence: analysis.confidence,
      sections: analysis.sections,
      key_strengths: analysis.keyStrengths,
      key_concerns: analysis.keyConcerns,
      recommended_next_steps: analysis.recommendedNextSteps,
      llm_model: llmModel,
      generated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as FeasibilityReportRow;
}

export async function listFeasibilityReportsForApplicant(applicantId: string): Promise<FeasibilityReportRow[]> {
  const { data, error } = await supabase
    .from("feasibility_reports")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("generated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as FeasibilityReportRow[];
}

export async function getFeasibilityReport(id: string): Promise<FeasibilityReportRow | null> {
  const { data, error } = await supabase.from("feasibility_reports").select("*").eq("id", id).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as FeasibilityReportRow) : null;
}
