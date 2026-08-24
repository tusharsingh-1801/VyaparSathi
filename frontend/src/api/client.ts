import type {
  AnalyzeResponse,
  Applicant,
  BusinessCategory,
  CategoryRecommendation,
  LocationSuggestion,
  RepaymentPeriod,
  ReportRow,
  ResolvedLocation,
  SchemeRow,
  WorkingCapitalPlan,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Every backend error response has this shape (see backend/src/middleware/errorHandler.ts).
interface ErrorBody {
  success: false;
  error: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Could not reach the backend. Is it running on " + API_URL + "?");
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (body as ErrorBody | null)?.error || `Request failed (HTTP ${response.status})`;
    throw new Error(message);
  }

  return body as T;
}

export function fetchCategories(): Promise<{ success: true; categories: BusinessCategory[] }> {
  return request("/business/categories");
}

export function searchLocations(
  query: string
): Promise<{ success: true; suggestions: LocationSuggestion[] }> {
  return request(`/locations/search?q=${encodeURIComponent(query)}`);
}

export function analyzeBusiness(input: {
  location: string;
  businessCategory: string;
  availableMarginCapital: number;
  applicantId?: string;
}): Promise<AnalyzeResponse> {
  return request("/business/analyze", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---- Business Profile ----

export function createApplicant(input: {
  villageName: string;
  categoryId: string;
  marginCapital: number;
  socialCategory?: string | null;
  expectedMonthlyIncome?: number | null;
  preferredLanguage?: string;
}): Promise<{ success: true; applicant: Applicant; villagePath: string | null }> {
  return request("/applicants", { method: "POST", body: JSON.stringify(input) });
}

export function getApplicant(
  id: string
): Promise<{ success: true; applicant: Applicant; villagePath: string | null }> {
  return request(`/applicants/${id}`);
}

export function updateApplicant(
  id: string,
  patch: Partial<{
    villageName: string;
    categoryId: string;
    marginCapital: number;
    socialCategory: string | null;
    expectedMonthlyIncome: number | null;
    preferredLanguage: string;
  }>
): Promise<{ success: true; applicant: Applicant; villagePath: string | null }> {
  return request(`/applicants/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

// ---- Reports ----

export function listReports(applicantId: string): Promise<{ success: true; reports: ReportRow[] }> {
  return request(`/reports?applicantId=${encodeURIComponent(applicantId)}`);
}

export function getReport(id: string): Promise<{
  success: true;
  report: ReportRow;
  workingCapital: { plan: WorkingCapitalPlan; items: unknown[] } | null;
  repaymentSchedule: RepaymentPeriod[];
}> {
  return request(`/reports/${id}`);
}

// ---- Discovery ----

export function getSchemes(): Promise<{ success: true; schemes: SchemeRow[] }> {
  return request("/discovery/schemes");
}

export function getCategoryRecommendations(
  location: string
): Promise<{ success: true; locationResolved: boolean; location: ResolvedLocation | null; recommendations: CategoryRecommendation[] }> {
  return request(`/discovery/recommendations?location=${encodeURIComponent(location)}`);
}
