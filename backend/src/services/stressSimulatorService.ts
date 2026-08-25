import { callSarvamChat, SarvamChatMessage } from "./sarvamService";
import { AdvisorContext } from "./aiAdvisorService";

// Fast conversational model — same choice as the AI Advisor chat, for the same reason:
// this is a live back-and-forth, not a one-shot report, so the reasoning model's "thinking"
// pass would make each turn feel sluggish.
const SIMULATOR_MODEL = "sarvam-105b-conversations";
const MAX_TOKENS = 320;

export interface StressScenario {
  id: string;
  title: string;
  description: string;
  persona: string; // who/what the LLM plays in this scenario
  openingLine: string; // shown to the user immediately, also seeds the roleplay
}

// A small fixed set, defined in-repo — no DB table, matching the AI Advisor's chat, which
// is also entirely session-only (nothing persisted).
export const STRESS_SCENARIOS: StressScenario[] = [
  {
    id: "angry-customer",
    title: "Angry Customer",
    description: "A customer is demanding a refund and threatening to tell others not to buy from you.",
    persona:
      "an upset customer who bought a product/service that didn't meet their expectations, demanding a refund loudly",
    openingLine: "This is unacceptable! I want my money back right now, or I'm telling everyone in the village not to shop here.",
  },
  {
    id: "cash-crunch",
    title: "Cash Crunch — Supplier Payment Due",
    description: "Your supplier wants payment today, but your own customers haven't paid you yet.",
    persona: "a supplier who has delivered raw materials on credit and is now insisting on immediate payment",
    openingLine: "I need that payment today. I have my own bills to pay — I can't wait any longer.",
  },
  {
    id: "competitor-price-drop",
    title: "Sudden Competitor Price Drop",
    description: "A new competitor just opened nearby and is undercutting your prices sharply.",
    persona:
      "a business coach narrating that a competitor has just opened next door selling the same thing 20% cheaper, then reacting to the entrepreneur's plan",
    openingLine: "Heads up — a new shop just opened two doors down, same products, 20% cheaper. What's your move?",
  },
  {
    id: "monsoon-disruption",
    title: "Monsoon / Flood Disruption",
    description: "Heavy rains have cut off the main road and damaged some of your stock.",
    persona:
      "a business coach describing that flooding has blocked deliveries for a week and damaged part of the stock, then reacting to the entrepreneur's plan",
    openingLine: "The main road's been flooded for two days, deliveries are stuck, and some stock got water-damaged. What now?",
  },
  {
    id: "regulatory-inspection",
    title: "Regulatory Inspection",
    description: "A government inspector has shown up asking for licenses and paperwork you're not sure you have.",
    persona: "a government inspector conducting a surprise compliance check and asking for licenses/paperwork",
    openingLine: "Good morning. I'm here for a routine inspection — please show me your business license and registration papers.",
  },
];

export function getScenario(id: string): StressScenario | undefined {
  return STRESS_SCENARIOS.find((s) => s.id === id);
}

function fmtINR(value: number | null | undefined): string {
  return value === null || value === undefined ? "unknown" : `₹${value.toLocaleString("en-IN")}`;
}

function buildGroundingBlock(context: AdvisorContext): string {
  const lines: string[] = [];
  if (context.applicant) {
    const a = context.applicant;
    lines.push(
      `Entrepreneur profile: business category "${context.categoryName ?? a.category_id}", ` +
        `location ${context.villagePath ?? "unknown"}, ` +
        `available margin capital ${fmtINR(a.margin_capital)}.`
    );
  }
  if (context.latestReport?.numbers) {
    const n = context.latestReport.numbers;
    lines.push(
      `Their latest financial plan: project cost ${fmtINR(n.projectCost)}, loan amount ${fmtINR(n.loanAmount)}, ` +
        `EMI ${fmtINR(n.emiEstimateMonthly)}.`
    );
  }
  return lines.length > 0 ? `\n\nWhat you know about this entrepreneur (use it to make the scenario feel real, e.g. reference their actual numbers/location):\n${lines.join("\n")}` : "";
}

function buildScenarioSystemPrompt(scenario: StressScenario, context: AdvisorContext): string {
  return (
    `You are running a business stress-test roleplay simulation for a rural/semi-urban Indian entrepreneur, ` +
    `built into this platform — not a generic chatbot.\n\n` +
    `Scenario: ${scenario.description}\n` +
    `You play the role of ${scenario.persona}. Stay fully in character. React realistically and specifically ` +
    `to what the entrepreneur says — escalate if they respond poorly (vague, defensive, dismissive), and de-escalate ` +
    `or show appreciation if they respond well (concrete, calm, solution-oriented). Keep each reply short (2-4 sentences), ` +
    `like real spoken dialogue, not a lecture.\n\n` +
    `If the entrepreneur says something like "end simulation", "that's enough", or asks for feedback/debrief, ` +
    `immediately BREAK CHARACTER and instead give a short structured debrief with exactly these three parts: ` +
    `"What went well:", "What to improve:", and "3 concrete tips:" (numbered). Base the debrief specifically on how ` +
    `they actually responded during this conversation, not generic advice.` +
    buildGroundingBlock(context)
  );
}

export async function continueStressSession(
  scenario: StressScenario,
  history: SarvamChatMessage[],
  context: AdvisorContext
): Promise<string> {
  const messages: SarvamChatMessage[] = [
    { role: "system", content: buildScenarioSystemPrompt(scenario, context) },
    { role: "assistant", content: scenario.openingLine },
    ...history,
  ];

  const reply = await callSarvamChat(messages, {
    model: SIMULATOR_MODEL,
    maxTokens: MAX_TOKENS,
    temperature: 0.6, // higher than the advisor — roleplay benefits from more natural variation
    timeoutMs: 18000, // a bit more headroom than the advisor's 12s — debrief replies run longer than normal turns
  });

  return reply.trim();
}
