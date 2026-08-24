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
  code: number;
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

// Raw `schemes` table row, as returned by GET /api/discovery/schemes.
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
  savedReportId: string | null;
  saveError: string | null;
  workingCapitalPlan: WorkingCapitalPlan | null;
  repaymentSchedule: RepaymentPeriod[];
}

// ---- Business Profile ----

export interface Applicant {
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

// ---- Saved reports ----

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

// ---- Financial planning ----

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

export interface RepaymentPeriod {
  periodNo: number;
  periodType: "month" | "quarter";
  phase: "moratorium" | "repayment";
  openingBalance: number;
  interestAccrued: number;
  principalRepaid: number;
  paymentDue: number;
  closingBalance: number;
}

// ---- Discovery ----

export interface CategoryRecommendation {
  categoryId: string;
  categoryName: string;
  suitability: number | null;
  demandScore: number | null;
  saturationScore: number | null;
  capitalFitScore: number | null;
  rationale: string;
  rank: number;
}
