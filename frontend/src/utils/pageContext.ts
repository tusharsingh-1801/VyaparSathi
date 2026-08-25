// Lightweight bridge so the AI Advisor can see live, unsaved data from whatever page the
// user was just on (e.g. a Financial Planner result) — most of that isn't persisted to the
// backend, so without this the advisor has no way to know about it at all.
const KEY = "aiAdvisorPageContext";

export function setPageContext(summary: string) {
  sessionStorage.setItem(KEY, summary);
}

export function getPageContext(): string | null {
  return sessionStorage.getItem(KEY);
}
