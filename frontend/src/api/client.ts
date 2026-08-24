import type { AnalyzeResponse, BusinessCategory, LocationSuggestion } from "../types";

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
}): Promise<AnalyzeResponse> {
  return request("/business/analyze", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
