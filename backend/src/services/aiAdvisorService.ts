import { callSarvamChat, SarvamChatMessage } from "./sarvamService";
import { ApplicantRow, ReportRow } from "../types";

// sarvam-105b (used for the full Business Advisory analysis) is a reasoning model that
// spends several seconds "thinking" before answering — fine for a one-shot report, too
// slow for a live chat. sarvam-105b-conversations skips that reasoning pass and is
// designed for real-time use. Token budget is deliberately larger than a typical "fast
// chatbot" default — user feedback was that short 1-3 sentence answers felt shallow;
// depth now matters more than shaving the last second or two off response time.
const ADVISOR_MODEL = "sarvam-105b-conversations";
const MAX_TOKENS = 420;

export interface AdvisorContext {
  applicant?: ApplicantRow | null;
  villagePath?: string | null;
  categoryName?: string;
  latestReport?: ReportRow | null;
  // Free-text summary of whatever the user is currently looking at on the page they opened
  // the advisor from (e.g. a live, unsaved Financial Planner result) — the frontend fills
  // this in since that data often isn't persisted anywhere the backend can look up.
  pageContext?: string;
}

function fmtINR(value: number | null | undefined): string {
  return value === null || value === undefined ? "unknown" : `₹${value.toLocaleString("en-IN")}`;
}

// Static knowledge about this app's own methodology — without this, the model has no way
// to explain product concepts like "safe loan" (it isn't a bank policy, it's a figure we
// calculate) and falls back to generic, wrong-sounding filler like "check with your bank."
const PRODUCT_KNOWLEDGE = `How this app's own numbers work (explain these when asked, even without the user's specific figures):
- "Max loan" = the largest amount the government scheme rules allow for their project cost.
- "Safe loan" = OUR recommendation, smaller than max loan, sized so their own expected revenue minus expenses covers the EMI with a 1.3x safety buffer. It is not a bank decision — it's calculated from the entrepreneur's own revenue/expense inputs in the Financial Planner page.
- "Opportunity Score" = a 0-100 composite of 6 factors (market potential, competition, financial feasibility, local economic fit, supply availability, risk), each from real data or marked unavailable.
- "Data Confidence" = a 0-100% transparency score showing how much of an analysis is backed by government/market data vs estimated.
- EMI, working capital, and repayment schedules are calculated deterministically, never guessed by AI.`;

/**
 * Builds a compact but genuinely personalized grounding block from what we know about this
 * applicant — profile, location, latest saved analysis, whatever the user is currently
 * looking at on screen, plus static knowledge of the app's own methodology (so it can
 * explain concepts like "safe loan" even when no specific numbers are available yet).
 */
function buildSystemPrompt(context: AdvisorContext): string {
  const lines: string[] = [];

  if (context.applicant) {
    const a = context.applicant;
    lines.push(
      `Entrepreneur profile: business category "${context.categoryName ?? a.category_id}", ` +
        `location ${context.villagePath ?? "unknown"}, ` +
        `available margin capital ${fmtINR(a.margin_capital)}` +
        `${a.social_category ? `, social category ${a.social_category}` : ""}` +
        `${a.expected_monthly_income ? `, expected monthly income ${fmtINR(a.expected_monthly_income)}` : ""}.`
    );
  }

  const report = context.latestReport;
  if (report) {
    const n = report.numbers;
    lines.push(
      `Their latest saved financial analysis: project cost ${fmtINR(n.projectCost)}, ` +
        `loan amount ${fmtINR(n.loanAmount)}${n.loanCapped ? " (capped at scheme maximum)" : ""}, ` +
        `scheme "${n.scheme?.name ?? "none applicable"}" at ${n.scheme?.interestRate ?? "?"}% interest, ` +
        `${n.scheme?.tenureYears ?? "?"}-year tenure, ${n.scheme?.moratoriumMonths ?? "?"}-month moratorium, ` +
        `EMI ${fmtINR(n.emiEstimateMonthly)}, total repayment ${fmtINR(n.totalRepaymentEstimate)}.`
    );

    // One compact line instead of expanding SWOT/risks/recommendations separately —
    // keeps the prompt (and therefore response time) small. The model can still be
    // asked specific follow-ups like "what are the risks?" using this as a seed; deeper
    // detail lives on the Reports page itself.
    if (report.narrative?.summary) {
      lines.push(`Prior AI analysis: ${report.narrative.summary.slice(0, 220)}`);
    }
  }

  if (context.pageContext) {
    lines.push(`What the user is currently looking at right now: ${context.pageContext.slice(0, 400)}`);
  }

  const groundingBlock = lines.length > 0 ? `\n\nWhat you know about this entrepreneur:\n${lines.join("\n")}` : "";

  return (
    `You are a business advisory assistant for rural/semi-urban Indian entrepreneurs, built into this platform — not a generic chatbot. ` +
    `Use the entrepreneur's own data below to answer specifically — mention their actual numbers/location/scheme instead of speaking generically, when relevant to the question. ` +
    `Give a substantive, advisory answer, not a one-liner: briefly explain the "why", then give 1-3 concrete, specific next steps or things to watch for that this entrepreneur can act on. Use short plain-language sentences; a few short lines is fine, don't pad with filler. ` +
    `Never invent statistics, prices, or scheme details not given to you — if a SPECIFIC number isn't in their data, explain the general concept from your product knowledge instead of deflecting to a bank or third party (nothing here is a bank decision). ` +
    `\n\n${PRODUCT_KNOWLEDGE}` +
    groundingBlock
  );
}

// Cheap connection warm-up for server startup — establishes the TLS connection to Sarvam
// ahead of the first real user message, using the fast model and a tiny token budget so
// it doesn't cost meaningful latency or quota itself.
export async function warmUpAdvisorConnection(): Promise<void> {
  await callSarvamChat([{ role: "user", content: "hi" }], { model: ADVISOR_MODEL, maxTokens: 5 });
}

export async function chatWithAdvisor(history: SarvamChatMessage[], context: AdvisorContext): Promise<string> {
  const messages: SarvamChatMessage[] = [{ role: "system", content: buildSystemPrompt(context) }, ...history];

  const reply = await callSarvamChat(messages, {
    model: ADVISOR_MODEL,
    maxTokens: MAX_TOKENS,
    temperature: 0.4,
    timeoutMs: 12000, // safety net for network outliers — typical response is 4-7s
  });

  return reply.trim();
}

/**
 * Proactive mode: instead of waiting for the user to type something, generate one
 * unprompted, specific insight from their own profile/report data (a risk to watch, a
 * concrete opportunity, or a next step) — shown automatically when the Advisor page opens.
 * Requires real grounding data; the frontend only calls this when there's a profile/report
 * to reason from, otherwise there's nothing specific to say.
 */
export async function generateProactiveInsight(context: AdvisorContext): Promise<string> {
  return chatWithAdvisor(
    [
      {
        role: "user",
        content:
          "Without me asking a specific question, give me ONE proactive, specific insight, risk to watch, or next step about my business situation right now, based on my actual data above. Be concrete and specific to my numbers/location/scheme, not generic advice.",
      },
    ],
    context
  );
}
