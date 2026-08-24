import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { AIAnalysis } from "../types";

// The exact structure we require back from Sarvam (Step 8). Using response_format:
// json_schema makes the model's output conform to this shape instead of free text.
const ANALYSIS_JSON_SCHEMA = {
  name: "business_analysis",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "summary",
      "marketOpportunity",
      "competition",
      "swot",
      "risks",
      "recommendations",
      "financialAnalysis",
      "finalRecommendation",
      "dataConfidence",
    ],
    properties: {
      summary: { type: "string" },
      marketOpportunity: {
        type: "object",
        additionalProperties: false,
        required: ["score", "analysis"],
        properties: {
          score: { type: ["number", "null"] },
          analysis: { type: "string" },
        },
      },
      competition: {
        type: "object",
        additionalProperties: false,
        required: ["level", "analysis"],
        properties: {
          level: { type: "string" },
          analysis: { type: "string" },
        },
      },
      swot: {
        type: "object",
        additionalProperties: false,
        required: ["strengths", "weaknesses", "opportunities", "threats"],
        properties: {
          strengths: { type: "array", items: { type: "string" } },
          weaknesses: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          threats: { type: "array", items: { type: "string" } },
        },
      },
      risks: { type: "array", items: { type: "string" } },
      recommendations: { type: "array", items: { type: "string" } },
      financialAnalysis: { type: "string" },
      finalRecommendation: { type: "string" },
      dataConfidence: { type: "string" },
    },
  },
};

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
6. Respond only with the JSON object matching the required schema — no extra commentary.`;

interface SarvamChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callSarvamChat(messages: SarvamChatMessage[], options: { maxTokens?: number; jsonSchema?: boolean } = {}) {
  if (!env.sarvamApiKey) {
    throw new AppError(
      "SARVAM_API_KEY is not configured on the server. Add it to backend/.env to enable AI analysis.",
      503
    );
  }

  const body: Record<string, unknown> = {
    model: env.sarvamModel,
    messages,
    temperature: 0.2,
    max_tokens: options.maxTokens ?? 2048,
  };

  if (options.jsonSchema) {
    body.response_format = { type: "json_schema", json_schema: ANALYSIS_JSON_SCHEMA };
  }

  let response: Response;
  try {
    response = await fetch(env.sarvamApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.sarvamApiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new AppError(
      `Could not reach Sarvam AI (network error): ${(networkErr as Error).message}`,
      502
    );
  }

  if (response.status === 429) {
    throw new AppError("Sarvam AI rate limit reached. Please try again in a moment.", 429);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new AppError(`Sarvam AI request failed (HTTP ${response.status}): ${text}`, 502);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AppError("Sarvam AI returned an empty or unexpected response.", 502);
  }

  return content;
}

/** Minimal request used by GET /api/ai/test to confirm the integration is wired up. */
export async function pingSarvam(): Promise<string> {
  const content = await callSarvamChat(
    [{ role: "user", content: "Reply with exactly one word: ok" }],
    { maxTokens: 16 }
  );
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
  const userMessage = `Here is the business context. Analyze it and respond with the required JSON only.\n\n${JSON.stringify(
    context,
    null,
    2
  )}`;

  const raw = await callSarvamChat(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    { maxTokens: 2048, jsonSchema: true }
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AppError("Sarvam AI response was not valid JSON.", 502);
  }

  if (!isValidAnalysis(parsed)) {
    throw new AppError("Sarvam AI response did not match the expected analysis structure.", 502);
  }

  return parsed;
}
