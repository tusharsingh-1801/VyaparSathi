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

export interface CostNormRow {
  id: number;
  category_id: string;
  state_code: number | null;
  item: string;
  item_hi: string;
  cost_type: "capital" | "recurring";
  pct_of_project: number | null;
  pct_monthly: number | null;
  as_of_year: number;
  source_id: string;
}

export interface RiskApplicabilityRow {
  id: number;
  risk_type_id: string;
  category_id: string | null;
  district_code: number | null;
  severity: string;
  evidence: string | null;
  source_id: string | null;
  risk_types?: { name: string; name_hi: string; risk_class: string; description: string | null };
}

export interface MarketOpportunityRow {
  id: number;
  block_code: number;
  category_id: string;
  niche: string;
  gap_score: number;
  rationale: string;
  evidence_source: string;
}

export interface EnterpriseCountRow {
  id: number;
  admin_level: string;
  admin_code: number;
  category_id: string;
  unit_count: number;
  as_of_year: number;
}

export interface MarketDataBundle {
  dataConfidence: "high" | "medium" | "low";
  marketOpportunities: MarketOpportunityRow[];
  competitors: unknown[];
  purchasingPower: unknown | null;
  priceSignals: unknown[];
  villageDemographics: unknown | null;
  villageAmenities: unknown | null;
  enterpriseCounts: EnterpriseCountRow[];
  costNorms: CostNormRow[];
  risks: RiskApplicabilityRow[];
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

// ---- Business Profile (applicants table) ----

export interface ApplicantRow {
  id: string;
  auth_user_id: string | null;
  village_code: number;
  margin_capital: number;
  category_id: string;
  social_category: string | null;
  expected_monthly_income: number | null;
  preferred_language: string;
  created_at: string;
}

export interface CreateApplicantInput {
  villageName: string; // resolved to villages.lgd_code server-side
  marginCapital: number;
  categoryId: string;
  socialCategory?: string | null;
  expectedMonthlyIncome?: number | null;
  preferredLanguage?: string; // defaults to "en"
}

// ---- Saved reports (reports table + child tables) ----

export interface ReportRow {
  id: string;
  applicant_id: string;
  input_hash: string;
  numbers: FinancialResult;
  scheme_id: string | null;
  narrative: AIAnalysis | null;
  numbers_verified: boolean;
  verification_notes: string | null;
  generation_attempts: number;
  llm_model: string | null;
  generated_at: string;
}

// ---- Financial planning: working capital ----

export interface WorkingCapitalItem {
  item: string;
  costType: "capital" | "recurring";
  amount: number;
}

export interface WorkingCapitalPlan {
  reportId: string;
  capitalExpenditure: number;
  monthlyOperating: number;
  wcCycleMonths: number;
  workingCapitalNeed: number;
  expectedMonthlyRevenue: number | null;
  breakEvenMonths: number | null;
  items: WorkingCapitalItem[];
  assumptions: string[];
}

// ---- Financial planning: repayment schedule ----

export interface RepaymentPeriod {
  periodNo: number;
  periodType: "month" | "quarter"; // the only values repayment_schedule's DB check constraint accepts
  phase: "moratorium" | "repayment";
  openingBalance: number;
  interestAccrued: number;
  principalRepaid: number;
  paymentDue: number;
  closingBalance: number;
}

// ---- Discovery: category recommendations ----

export interface CategoryRecommendation {
  categoryId: string;
  categoryName: string;
  suitability: number | null; // 0-100, null if no signal data exists at all
  demandScore: number | null;
  saturationScore: number | null;
  capitalFitScore: number | null;
  rationale: string;
  rank: number;
}
