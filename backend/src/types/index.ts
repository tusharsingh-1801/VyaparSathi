// ---- Request / response contracts for the public API ----

export interface AnalyzeRequestBody {
  location: string;
  businessCategory: string;
  availableMarginCapital: number;
}

// ---- Rows as they actually exist in the Supabase schema (only the columns we use) ----

export interface SchemeRow {
  id: string;
  name: string;
  name_hi: string;
  implementing_agency: string | null;
  min_project_cost: number;
  max_project_cost: number;
  margin_pct: number;
  max_loan_pct: number;
  max_loan_amount: number;
  interest_rate: number;
  tenure_years: number;
  moratorium_months: number;
  repayment_frequency: string;
  is_active: boolean;
}

export interface BusinessCategoryRow {
  id: string;
  name: string;
  name_hi: string;
  nic_codes: string[];
  is_seasonal: boolean;
  typical_margin_pct: number | null;
  sort_order: number;
}

export interface StateRow {
  lgd_code: number;
  name: string;
  name_hi: string | null;
}

export interface DistrictRow {
  lgd_code: number;
  state_code: number;
  name: string;
  name_hi: string | null;
  annual_growth_rate: number;
}

export interface BlockRow {
  lgd_code: number;
  district_code: number;
  name: string;
  name_hi: string | null;
}

export interface VillageRow {
  lgd_code: number;
  block_code: number;
  district_code: number;
  name: string;
  name_hi: string | null;
}

// ---- Normalized location result used across the app ----

export type LocationMatchLevel = "village" | "block" | "district" | "state";

export interface ResolvedLocation {
  matchedLevel: LocationMatchLevel;
  matchedName: string;
  state: { code: number; name: string } | null;
  district: { code: number; name: string } | null;
  block: { code: number; name: string } | null;
  village: { code: number; name: string } | null;
}

// ---- Financial engine output ----

export interface FinancialResult {
  availableMarginCapital: number;
  projectCost: number;
  schemeApplicable: boolean;
  scheme: {
    id: string;
    name: string;
    interestRate: number;
    tenureYears: number;
    moratoriumMonths: number;
    repaymentFrequency: string;
  } | null;
  loanAmountRequested: number | null; // uncapped, 90% of project cost
  loanAmount: number | null; // final amount after applying scheme cap
  loanCapped: boolean;
  loanShortfall: number | null; // how much the loan was reduced by the cap
  beneficiaryContribution: number | null; // projectCost - loanAmount
  additionalOwnContributionRequired: number | null; // extra own funds needed because of the cap
  emiEstimateMonthly: number | null;
  totalRepaymentEstimate: number | null;
  totalInterestEstimate: number | null;
  repaymentMonths: number | null;
  message: string | null; // set when no scheme applies, or when the loan was capped
}

// ---- Market data bundle (all optional — DB may not have coverage for a given place) ----

export interface MarketDataBundle {
  dataConfidence: "high" | "medium" | "low";
  marketOpportunities: unknown[];
  competitors: unknown[];
  purchasingPower: unknown | null;
  priceSignals: unknown[];
  villageDemographics: unknown | null;
  villageAmenities: unknown | null;
  enterpriseCounts: unknown[];
  costNorms: unknown[];
  risks: unknown[];
  schemeTargets: unknown[];
}

// ---- Structured AI output (Step 8 target shape) ----

export interface AIAnalysis {
  summary: string;
  marketOpportunity: {
    score: number | null;
    analysis: string;
  };
  competition: {
    level: string;
    analysis: string;
  };
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
