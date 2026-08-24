import { createHash, randomUUID } from "node:crypto";
import { supabase } from "../config/supabaseClient";
import { env } from "../config/env";
import { AIAnalysis, AnalyzeRequestBody, FinancialResult, ReportRow, RiskApplicabilityRow } from "../types";

function hashInput(input: AnalyzeRequestBody): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

/**
 * Persists one analysis run. Only called when a scheme actually applies — reports.scheme_id
 * is NOT NULL, so a "no scheme covers this project size" result is never saved (nothing
 * useful to attach it to). Also writes the SWOT and risk rows so they show up in the
 * applicant's saved report history, not just the live response.
 */
export async function saveReport(params: {
  applicantId: string;
  input: AnalyzeRequestBody;
  financial: FinancialResult;
  aiAnalysis: AIAnalysis | null;
  risks: RiskApplicabilityRow[];
  langCode: string;
}): Promise<{ report: ReportRow; isNew: boolean }> {
  const { applicantId, input, financial, aiAnalysis, risks, langCode } = params;

  if (!financial.scheme) {
    throw new Error("saveReport called without an applicable scheme — this should never happen.");
  }

  const id = randomUUID();
  const inputHash = hashInput(input);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      id,
      applicant_id: applicantId,
      input_hash: inputHash,
      numbers: financial,
      scheme_id: financial.scheme.id,
      narrative: aiAnalysis,
      numbers_verified: true, // numbers come straight from the deterministic engine, never from the LLM
      generation_attempts: 1,
      llm_model: aiAnalysis ? env.sarvamModel : null,
      generated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    // reports.input_hash is unique — the exact same {location, businessCategory,
    // availableMarginCapital} triggers a collision on re-analysis (e.g. a page refresh
    // or double submit). Treat that as idempotent success and return the existing report
    // rather than erroring, instead of writing duplicate swot/risk rows for it.
    if (error.code === "23505") {
      const existing = await getReportByInputHash(inputHash);
      if (existing) return { report: existing, isNew: false };
    }
    throw error;
  }

  await Promise.all([writeSwotRows(id, aiAnalysis, langCode), writeRiskRows(id, risks, langCode)]);

  return { report: data as ReportRow, isNew: true };
}

async function getReportByInputHash(inputHash: string): Promise<ReportRow | null> {
  const { data, error } = await supabase.from("reports").select("*").eq("input_hash", inputHash).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as ReportRow) : null;
}

async function writeSwotRows(reportId: string, aiAnalysis: AIAnalysis | null, langCode: string) {
  if (!aiAnalysis) return;

  const rows: Array<{
    report_id: string;
    quadrant: string;
    statement: string;
    lang_code: string;
    sort_order: number;
  }> = [];

  const quadrants: Array<[keyof AIAnalysis["swot"], string]> = [
    ["strengths", "strength"],
    ["weaknesses", "weakness"],
    ["opportunities", "opportunity"],
    ["threats", "threat"],
  ];

  for (const [key, quadrant] of quadrants) {
    aiAnalysis.swot[key].forEach((statement, i) => {
      rows.push({ report_id: reportId, quadrant, statement, lang_code: langCode, sort_order: i });
    });
  }

  if (rows.length === 0) return;
  const { error } = await supabase.from("report_swot").insert(rows);
  if (error) throw error;
}

async function writeRiskRows(reportId: string, risks: RiskApplicabilityRow[], langCode: string) {
  if (risks.length === 0) return;

  const rows = risks.map((r) => ({
    report_id: reportId,
    risk_type_id: r.risk_type_id,
    severity: r.severity,
    explanation: r.evidence ?? r.risk_types?.description ?? "No detail available.",
    lang_code: langCode,
  }));

  const { error } = await supabase.from("report_risks").insert(rows);
  if (error) throw error;
}

export async function listReportsForApplicant(applicantId: string): Promise<ReportRow[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("applicant_id", applicantId)
    .order("generated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function getReport(id: string): Promise<ReportRow | null> {
  const { data, error } = await supabase.from("reports").select("*").eq("id", id).limit(1);
  if (error) throw error;
  return data && data.length > 0 ? (data[0] as ReportRow) : null;
}
