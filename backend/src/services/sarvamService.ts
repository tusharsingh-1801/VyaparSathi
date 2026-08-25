import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { AIAnalysis } from "../types";

// sarvam-105b is a reasoning model — it spends completion tokens on an internal
// "reasoning_content" pass before writing the final answer. Two things follow from that:
//
// 1. max_tokens must budget for reasoning + the actual answer, not just the answer.
//    The account's plan also hard-caps this (400 error: "exceeds the maximum allowed for
//    sarvam-105b for your subscription tier (starter): 4096"), so 4096 is both the safe
//    ceiling and the amount we need for a full analysis.
// 2. response_format: json_schema (structured output) was tested against this model/tier
//    and reliably drove it into a repetitive reasoning loop that never terminated —
//    it burned the entire token budget on reasoning_content and returned content: null
//    with finish_reason: "length". Describing the required JSON shape in the prompt text
//    instead, and validating the parsed result ourselves, works cleanly and finishes with
//    finish_reason: "stop" in a fraction of the tokens. Do not switch back to json_schema
//    without re-testing — this was verified directly against the Sarvam API.
const MAX_TOKENS = 4096;

const ANALYSIS_JSON_SHAPE = `{"summary":string,"marketOpportunity":{"score":number|null,"analysis":string},"competition":{"level":string,"analysis":string},"swot":{"strengths":string[],"weaknesses":string[],"opportunities":string[],"threats":string[]},"risks":string[],"recommendations":string[],"financialAnalysis":string,"finalRecommendation":string,"dataConfidence":string}`;

const SYSTEM_PROMPT = `You are a business advisory assistant for rural and semi-urban entrepreneurs in India.

You will be given a JSON "context" object containing:
- financial figures already calculated by a deterministic finance engine (authoritative, do not recompute or alter them)
- location, business category, and market/risk data retrieved from a database (may be partial or missing for some sections)

Rules you must follow strictly:
1. Do not invent facts, statistics, competitors, prices, population figures, government schemes, or financial values that are not present in the supplied context.
2. Every number in your output must come from the context. Never introduce a new number.
3. If a section of the context is empty, null, or missing, clearly say the data is unavailable for that section instead of guessing or estimating a plausible-sounding value.
4. Distinguish verified data (present in context) from your own interpretation/estimate in your analysis text (e.g. "Based on the available data..." vs "This is not available in the current database").
5. Your job is to interpret the evidence given, not to replace the database or the financial engine.
6. Answer directly, without lengthy step-by-step deliberation.
7. Respond with ONLY a single JSON object, no markdown code fences, no commentary before or after, matching exactly this shape: ${ANALYSIS_JSON_SHAPE}`;

export interface SarvamChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callSarvamChat(
  messages: SarvamChatMessage[],
  options: { model?: string; maxTokens?: number; temperature?: number; timeoutMs?: number } = {}
): Promise<string> {
  if (!env.sarvamApiKey) {
    throw new AppError(
      "SARVAM_API_KEY is not configured on the server. Add it to backend/.env to enable AI analysis.",
      503
    );
  }

  const body = {
    model: options.model ?? env.sarvamModel,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? MAX_TOKENS,
  };

  // Third-party network calls occasionally stall — never let one hang the request forever.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);

  let response: Response;
  try {
    response = await fetch(env.sarvamApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Sarvam's documented auth method: api-subscription-key, not Authorization: Bearer.
        // Never log this header or the key value.
        "api-subscription-key": env.sarvamApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (networkErr) {
    const isTimeout = (networkErr as Error).name === "AbortError";
    throw new AppError(
      isTimeout
        ? "Sarvam AI took too long to respond. Please try again."
        : `Could not reach Sarvam AI (network error): ${(networkErr as Error).message}`,
      isTimeout ? 504 : 502
    );
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 429) {
    throw new AppError("Sarvam AI rate limit reached. Please try again in a moment.", 429);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(`Sarvam AI request failed (HTTP ${response.status}): ${text}`, 502);
  }

  const json = (await response.json()) as {
    choices?: Array<{ finish_reason?: string; message?: { content?: string | null } }>;
  };
  const choice = json?.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    // Most likely cause: the model spent its whole token budget on internal reasoning
    // before writing an answer (finish_reason "length" with content: null).
    throw new AppError(
      `Sarvam AI returned no content (finish_reason: ${choice?.finish_reason ?? "unknown"}). Try again, or the prompt may need to be shorter.`,
      502
    );
  }

  return content;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1] : trimmed;
}

/** Minimal request used by GET /api/ai/test to confirm the integration is wired up. */
export async function pingSarvam(): Promise<string> {
  const content = await callSarvamChat([
    { role: "user", content: "Reply with exactly one word: ok" },
  ]);
  return content.trim();
}

function isValidAnalysis(value: unknown): value is AIAnalysis {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.summary === "string" &&
    typeof v.marketOpportunity === "object" &&
    typeof v.competition === "object" &&
    typeof v.swot === "object" &&
    Array.isArray(v.risks) &&
    Array.isArray(v.recommendations) &&
    typeof v.financialAnalysis === "string" &&
    typeof v.finalRecommendation === "string" &&
    typeof v.dataConfidence === "string"
  );
}

/**
 * Sends the structured business context to Sarvam and returns validated, structured
 * analysis. The LLM interprets evidence only — it never calculates numbers itself.
 */
export async function generateBusinessAnalysis(context: unknown): Promise<AIAnalysis> {
  const userMessage = `Context:\n${JSON.stringify(context)}\n\nAnalyze this and respond with the required JSON only.`;

  const raw = await callSarvamChat([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ]);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new AppError("Sarvam AI response was not valid JSON.", 502);
  }

  if (!isValidAnalysis(parsed)) {
    throw new AppError("Sarvam AI response did not match the expected analysis structure.", 502);
  }

  return parsed;
}
