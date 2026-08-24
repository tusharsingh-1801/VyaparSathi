// Mirrors the shapes returned by the backend (see backend/src/types/index.ts).
// Kept as plain interfaces here since the frontend never imports backend code directly.

export interface BusinessCategory {
  id: string;
  name: string;
  name_hi: string;
  nic_codes: string[];
  is_seasonal: boolean;
  typical_margin_pct: number | null;
  sort_order: number;
}

export interface LocationSuggestion {
  level: "village" | "block" | "district" | "state";
  name: string;
  path: string;
}

export interface ResolvedLocation {
  matchedLevel: "village" | "block" | "district" | "state";
  matchedName: string;
  state: { code: number; name: string } | null;
  district: { code: number; name: string } | null;
  block: { code: number; name: string } | null;
  village: { code: number; name: string } | null;
}

export interface SchemeSummary {
  id: string;
  name: string;
  interestRate: number;
  tenureYears: number;
  moratoriumMonths: number;
  repaymentFrequency: string;
}

export interface FinancialResult {
  availableMarginCapital: number;
  projectCost: number;
  schemeApplicable: boolean;
  scheme: SchemeSummary | null;
  loanAmountRequested: number | null;
  loanAmount: number | null;
  loanCapped: boolean;
  loanShortfall: number | null;
  beneficiaryContribution: number | null;
  additionalOwnContributionRequired: number | null;
  emiEstimateMonthly: number | null;
  totalRepaymentEstimate: number | null;
  totalInterestEstimate: number | null;
  repaymentMonths: number | null;
  message: string | null;
}

export interface AIAnalysis {
  summary: string;
  marketOpportunity: { score: number | null; analysis: string };
  competition: { level: string; analysis: string };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  risks: string[];
  recommendations: string[];
  financialAnalysis: string;
  finalRecommendation: string;
  dataConfidence: string;
}

export interface AnalyzeResponse {
  success: boolean;
  input: {
    location: string;
    businessCategory: string;
    availableMarginCapital: number;
  };
  locationResolved: boolean;
  location: ResolvedLocation | null;
  categoryResolved: boolean;
  financial: FinancialResult;
  marketData: {
    dataConfidence: "high" | "medium" | "low";
    marketOpportunities: unknown[];
    competitors: unknown[];
    purchasingPower: unknown | null;
    priceSignals: unknown[];
    villageDemographics: unknown | null;
    villageAmenities: unknown | null;
    enterpriseCounts: unknown[];
    costNorms: unknown[];
    risks: Array<{
      severity: string;
      evidence: string | null;
      risk_types?: { name: string; description: string | null };
    }>;
    schemeTargets: Array<{
      scheme_name: string;
      target_units: number;
      apply_url: string | null;
    }>;
  };
  aiAnalysis: AIAnalysis | null;
  aiError: string | null;
}
