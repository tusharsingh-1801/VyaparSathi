// UI chrome strings only. Domain data (scheme names, category names, risk names) already
// has name_hi in the database — use those directly instead of duplicating them here.
const en = {
  appName: "Enterprise Intelligence",
  appTagline: "Rural & semi-urban business decision support",

  nav: {
    dashboard: "Dashboard",
    discovery: "Business Discovery",
    market: "Market Intelligence",
    financial: "Financial Planner",
    schemes: "Government Schemes",
    stress: "Stress Simulator",
    report: "Feasibility Report",
    advisor: "AI Advisor",
    profile: "Business Profile",
  },

  topbar: {
    language: "Language",
    notifications: "Notifications",
    settings: "Settings",
    switchProfile: "Switch profile",
    logout: "Log out",
  },

  common: {
    loading: "Loading...",
    retry: "Retry",
    viewDetails: "View details",
    close: "Close",
    submit: "Submit",
    cancel: "Cancel",
    save: "Save",
    edit: "Edit",
    comingSoon: "Coming soon",
    insufficientData: "Insufficient data",
    verified: "Verified",
    estimated: "Estimated",
    userProvided: "User-provided",
    source: "Source",
    status: "Status",
  },

  dashboard: {
    title: "Your Enterprise Intelligence",
    welcome: "Welcome back",
    subtitle: "Data → Analysis → Decision → Action",
    opportunityScore: "Opportunity Score",
    financialHealth: "Financial Health Score",
    recommendedProject: "Recommended Project Cost",
    recommendedLoan: "Recommended Financing",
    recommendedScheme: "Recommended Scheme",
    riskLevel: "Risk Level",
    dataConfidence: "Data Confidence",
    cta: "Explore My Best Business Opportunities",
    noProfileYet: "Run Business Discovery to see your enterprise intelligence here.",
    recentReports: "Recent reports",
    quickActions: "Quick actions",
  },

  discovery: {
    title: "Business Discovery",
    subtitle: "What enterprise should I start?",
    searchCta: "Find best-fit businesses",
    rank: "Rank",
    overallScore: "Opportunity Score",
    whyRecommended: "Why this score?",
    getFinancialPlan: "Get full financial plan for this business",
  },

  market: {
    title: "Market Intelligence",
    subtitle: "Hyper-local data for your area",
    population: "Population",
    households: "Households",
    literates: "Literates",
    amenities: "Local amenities",
    hasBank: "Bank nearby",
    hasAtm: "ATM nearby",
    hasMandi: "Mandi nearby",
    hasPuccaRoad: "Pucca road",
    hasPower: "Domestic power",
    nearestTown: "Nearest town",
    purchasingPower: "Purchasing power",
    perCapitaIncome: "Per capita income",
    affordabilityIndex: "Affordability index",
    priceSignals: "Commodity prices",
    competitors: "Competitors",
    enterpriseCounts: "Registered enterprises",
    districtGrowth: "District annual growth rate",
    improveAnalysis: "Improve My Analysis",
    improveAnalysisDesc: "Answer a few questions about what you observe locally to raise your data confidence.",
    confidenceBefore: "Confidence before",
    confidenceAfter: "Confidence after",
  },

  financial: {
    title: "Financial Planner",
    subtitle: "Safe loan sizing and cash flow planning",
    marginCapital: "Available margin capital (₹)",
    expectedRevenue: "Expected monthly revenue (₹)",
    operatingExpenses: "Monthly operating expenses (₹)",
    calculate: "Calculate financial plan",
    maxLoan: "Maximum possible loan",
    safeLoan: "Recommended safe loan",
    cashFlow: "12-month cash flow projection",
    breakEven: "Break-even month",
    emiCoverage: "EMI coverage ratio",
  },

  schemes: {
    title: "Government Schemes",
    subtitle: "Browse available financing schemes",
    likelyEligible: "Likely Eligible",
    needsVerification: "Needs Verification",
    interest: "Interest",
    tenure: "Tenure",
    moratorium: "Moratorium",
    maxLoan: "Max loan",
  },

  comingSoon: {
    stress: {
      title: "Stress Simulator",
      body: "Simulate revenue drops, cost increases, and demand shocks against your financial plan. Coming in the next build.",
    },
    report: {
      title: "Feasibility Report",
      body: "A downloadable, structured feasibility report combining every section of this platform. Your saved analyses are available in Report History below in the meantime.",
    },
    advisor: {
      title: "AI Advisor",
      body: "A dedicated conversational advisor interface. The AI-generated analysis is already available today inside Financial Planner results.",
    },
  },
};

export default en;
export type TranslationDictionary = typeof en;
