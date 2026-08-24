import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateFinancials } from "./financialService";
import { SchemeRow } from "../types";

// Synthetic scheme data mirroring the real `schemes` table rows (micro_finance / term_loan),
// kept local so these tests never depend on live Supabase data.
const schemes: SchemeRow[] = [
  {
    id: "micro_finance",
    name: "Micro Finance Scheme",
    name_hi: "सूक्ष्म वित्त योजना",
    implementing_agency: "State Channelizing Agency",
    min_project_cost: 0,
    max_project_cost: 140000,
    margin_pct: 10,
    max_loan_pct: 90,
    max_loan_amount: 125000,
    interest_rate: 6.5,
    tenure_years: 3,
    moratorium_months: 3,
    repayment_frequency: "quarterly",
    is_active: true,
  },
  {
    id: "term_loan",
    name: "Term Loan Scheme",
    name_hi: "सावधि ऋण योजना",
    implementing_agency: "State Channelizing Agency",
    min_project_cost: 140000,
    max_project_cost: 5000000,
    margin_pct: 10,
    max_loan_pct: 90,
    max_loan_amount: 4500000,
    interest_rate: 8,
    tenure_years: 7,
    moratorium_months: 6,
    repayment_frequency: "quarterly",
    is_active: true,
  },
];

test("₹1,00,000 margin routes to Term Loan Scheme with correct project cost and loan", () => {
  const result = calculateFinancials(100000, schemes);

  assert.equal(result.projectCost, 1000000);
  assert.equal(result.schemeApplicable, true);
  assert.equal(result.scheme?.id, "term_loan");
  assert.equal(result.loanAmountRequested, 900000);
  assert.equal(result.loanAmount, 900000);
  assert.equal(result.loanCapped, false);
  assert.equal(result.scheme?.interestRate, 8);
  assert.equal(result.scheme?.tenureYears, 7);
  assert.equal(result.scheme?.moratoriumMonths, 6);
});

test("project cost exactly at the ₹1.40 lakh boundary uses Micro Finance Scheme", () => {
  // 14,000 margin -> project cost = 1,40,000 (spec: "<=" 1.40 lakh is Micro Finance)
  const result = calculateFinancials(14000, schemes);

  assert.equal(result.projectCost, 140000);
  assert.equal(result.scheme?.id, "micro_finance");
});

test("just above the ₹1.40 lakh boundary routes to Term Loan Scheme", () => {
  // 14,001 margin -> project cost = 1,40,010
  const result = calculateFinancials(14001, schemes);

  assert.equal(result.scheme?.id, "term_loan");
});

test("loan is capped at the scheme maximum and the shortfall is reported", () => {
  // Use a scheme with a deliberately low cap to exercise the capping branch,
  // independent of whatever the live DB currently stores.
  const cappedSchemes: SchemeRow[] = [
    { ...schemes[0], max_loan_amount: 50000 },
  ];

  const result = calculateFinancials(20000, cappedSchemes);
  // projectCost = 200,000 -> exceeds max_project_cost(140000) of the only scheme,
  // so use a margin capital that keeps project cost within range instead.
  const inRange = calculateFinancials(10000, cappedSchemes);

  assert.equal(inRange.projectCost, 100000);
  assert.equal(inRange.loanAmountRequested, 90000);
  assert.equal(inRange.loanAmount, 50000);
  assert.equal(inRange.loanCapped, true);
  assert.equal(inRange.loanShortfall, 40000);
  assert.equal(inRange.additionalOwnContributionRequired, 40000);

  // Sanity check the out-of-range case still reports "no scheme applicable" cleanly.
  assert.equal(result.schemeApplicable, false);
  assert.equal(result.scheme, null);
});

test("project cost beyond every scheme's max_project_cost reports no applicable scheme", () => {
  const result = calculateFinancials(600000, schemes); // projectCost = 60,00,000
  assert.equal(result.schemeApplicable, false);
  assert.equal(result.scheme, null);
  assert.equal(result.loanAmount, null);
  assert.ok(result.message?.includes("exceeds the maximum project cost"));
});

test("rejects a non-positive availableMarginCapital", () => {
  assert.throws(() => calculateFinancials(0, schemes));
  assert.throws(() => calculateFinancials(-500, schemes));
});
