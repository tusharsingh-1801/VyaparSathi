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

export interface CompetitorRow {
  id: number;
  village_code: number | null;
  block_code: number;
  category_id: string;
  name: string | null;
  years_in_operation: number | null;
  scale: string | null;
  as_of_year: number;
}

export interface VillageDemographicsRow {
  village_code: number;
  census_year: number;
  population: number | null;
  households: number | null;
  males: number | null;
  females: number | null;
  literates: number | null;
  sc_population: number | null;
  st_population: number | null;
}

export interface VillageAmenitiesRow {
  village_code: number;
  census_year: number;
  has_bank: boolean | null;
  has_atm: boolean | null;
  has_pucca_road: boolean | null;
  has_power_domestic: boolean | null;
  has_mandi: boolean | null;
  nearest_town_km: number | null;
}

export interface PurchasingPowerRow {
  district_code: number;
  as_of_year: number;
  per_capita_income: number | null;
  mgnrega_wage_rate: number | null;
  affordability_index: number | null;
}

export interface PriceSignalRow {
  id: number;
  district_code: number;
  commodity: string;
  commodity_hi: string | null;
  unit: string;
  modal_price: number;
  min_price: number | null;
  max_price: number | null;
  price_date: string;
}

export interface MarketDataBundle {
  dataConfidence: "high" | "medium" | "low";
  marketOpportunities: MarketOpportunityRow[];
  competitors: CompetitorRow[];
  purchasingPower: PurchasingPowerRow | null;
  priceSignals: PriceSignalRow[];
  villageDemographics: VillageDemographicsRow | null;
  villageAmenities: VillageAmenitiesRow | null;
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
  name: string | null;
  village_code: number;
  margin_capital: number;
  category_id: string;
  social_category: string | null;
  expected_monthly_income: number | null;
  preferred_language: string;
  created_at: string;
}

export interface CreateApplicantInput {
  name: string;
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

// ---- Opportunity score (composite, 6 sub-scores) ----

export interface OpportunitySubScore {
  score: number | null; // 0-100, null if the underlying signal is missing
  label: string;
  explanation: string;
}

export interface OpportunityScoreResult {
  categoryId: string;
  categoryName: string;
  overallScore: number | null; // mean of whichever sub-scores are non-null
  rank: number;
  subScores: {
    marketPotential: OpportunitySubScore;
    competition: OpportunitySubScore;
    financialFeasibility: OpportunitySubScore;
    localEconomicFit: OpportunitySubScore;
    supplyAvailability: OpportunitySubScore;
    risk: OpportunitySubScore;
  };
}

// ---- Data confidence (4-bucket breakdown) ----

export interface DataConfidenceBucket {
  label: string;
  weight: number; // this bucket's max contribution to the overall %
  populatedSignals: number;
  possibleSignals: number;
  contribution: number; // populatedSignals/possibleSignals * weight
}

export interface DataConfidenceResult {
  overallPct: number; // 0-100, sum of bucket contributions
  buckets: {
    governmentData: DataConfidenceBucket;
    marketData: DataConfidenceBucket;
    userObservations: DataConfidenceBucket;
    estimatedIndicators: DataConfidenceBucket;
  };
}

// ---- Market Intelligence ----

export interface MarketIntelligenceResult {
  locationResolved: boolean;
  location: ResolvedLocation | null;
  demographics: VillageDemographicsRow | null;
  amenities: VillageAmenitiesRow | null;
  purchasingPower: PurchasingPowerRow | null;
  priceSignals: PriceSignalRow[];
  enterpriseCounts: EnterpriseCountRow[];
  competitors: CompetitorRow[];
  districtGrowthRate: number | null;
  confidence: DataConfidenceResult;
}

// ---- Financial Planner: safe vs max loan + cash flow ----

export interface FinancialPlanInput extends AnalyzeRequestBody {
  expectedMonthlyRevenue: number;
  monthlyOperatingExpenses: number;
}

export interface CashFlowMonth {
  month: number;
  revenue: number;
  operatingCosts: number;
  grossProfit: number;
  emi: number;
  netCashFlow: number;
  cashReserve: number;
}

export interface FinancialPlanResult {
  financial: FinancialResult;
  maxLoanAmount: number | null;
  safeLoanAmount: number | null;
  safeLoanExplanation: string;
  cashFlow: CashFlowMonth[];
  breakEvenMonth: number | null;
  emiCoverageRatio: number | null; // netCashFlow-before-EMI / EMI, higher = safer
}

// ---- Feasibility Report ----

export interface FeasibilitySection {
  label: string;
  score: number | null;
  narrative: string;
}

export interface FeasibilityAnalysis {
  verdict: "go" | "go_with_caution" | "no_go";
  confidence: "high" | "medium" | "low";
  summary: string;
  sections: {
    market: FeasibilitySection;
    financial: FeasibilitySection;
    operational: FeasibilitySection;
    risk: FeasibilitySection;
  };
  keyStrengths: string[];
  keyConcerns: string[];
  recommendedNextSteps: string[];
}

export interface FeasibilityReportRow {
  id: string;
  applicant_id: string;
  input: { location: string; businessCategory: string; marginCapital: number };
  verdict: "go" | "go_with_caution" | "no_go";
  confidence: "high" | "medium" | "low";
  sections: FeasibilityAnalysis["sections"];
  key_strengths: string[];
  key_concerns: string[];
  recommended_next_steps: string[];
  llm_model: string | null;
  generated_at: string;
}

// ---- Field observations (user-submitted local data) ----

export interface FieldObservationRow {
  id: string;
  applicant_id: string;
  location_code: number | null;
  question_key: string;
  question_text: string;
  answer: string;
  submitted_at: string;
}
