import type { EngineInput } from "@cashflow/core";
import { assertEngineInputShape } from "./helpers.js";

import basicSalaryRent from "./basic-salary-rent.json";
import creditCardCycle from "./credit-card-cycle.json";
import householdJune2026 from "./household-june-2026.json";
import installmentPlan from "./installment-plan.json";
import recurrenceOverrides from "./recurrence-overrides.json";
import settlementLinks from "./settlement-links.json";

export interface FixtureMeta {
  id: string;
  title: string;
  description: string;
  asOfDate: string;
  /** Key dates or balances to assert once the engine is fully implemented. */
  expectations: string[];
}

export const FIXTURE_CATALOG: FixtureMeta[] = [
  {
    id: "basic-salary-rent",
    title: "Basic salary + rent",
    description:
      "Minimal scenario: one working account (R$ 5.000), monthly salary on day 5 and rent on day 10. No cards or installments.",
    asOfDate: "2026-06-01",
    expectations: [
      "workingBalanceTodayCents = 500_000 on 2026-06-01",
      "Salary inflow projected on day 5; rent outflow on day 10",
      "nextNegativeDate = null with default buffer",
    ],
  },
  {
    id: "credit-card-cycle",
    title: "Credit card billing cycle",
    description:
      "Checking + credit card (closing 26, due 1). Opening debt R$ 1.500; purchase R$ 89,90 on Jun 27 accrues to Jul-Aug statement.",
    asOfDate: "2026-06-27",
    expectations: [
      "Purchase on 2026-06-27 does NOT reduce working balance on purchase date",
      "Statement stmt-jul-aug due 2026-08-01 projects working outflow of R$ 1.589,90",
      "Opening debt seeds first statement (due 2026-07-01)",
    ],
  },
  {
    id: "installment-plan",
    title: "Installment plans",
    description:
      "Three loan plans (36×, 24×, 12×) plus dormant plan. June installments for two loans already paid.",
    asOfDate: "2026-06-03",
    expectations: [
      "Paid installments (Jun 3) do not project again",
      "Scheduled Jul installments project on due dates",
      "Dormant plan excluded from projection",
    ],
  },
  {
    id: "recurrence-overrides",
    title: "Recurrence overrides",
    description:
      "Monthly salary, subscription, HOA fee, and one-off vehicle tax. Overrides: skip July salary, bump August HOA, move June subscription.",
    asOfDate: "2026-06-01",
    expectations: [
      "July 8 salary occurrence skipped",
      "August 12 HOA uses modified amount override",
      "June subscription moved from 15 → 18",
    ],
  },
  {
    id: "settlement-links",
    title: "Settlement links",
    description:
      "Planned items, installments, and card statements settled by actual transactions. Card statement paid on Jun 25.",
    asOfDate: "2026-06-25",
    expectations: [
      "Settled planned items suppressed from future projection",
      "Paid installment does not double-project",
      "Paid statement suppresses duplicate payment projection",
    ],
  },
  {
    id: "household-june-2026",
    title: "Household ledger — June 2026",
    description:
      "Rich dummy dataset: 7 accounts, 33 ledger transactions, 13 planned items, 3 loan plans, and credit card statements. Covers salaries, housing, support payments, taxes, and card cycles.",
    asOfDate: "2026-07-01",
    expectations: [
      "7 accounts (4 working + 2 cards + 1 investment)",
      "33 transactions spanning Jun 1 – Jul 1",
      "Settlement links on loans, HOA, support, and card payment",
      "Card purchase Jun 27 accrues; statement payment Jun 25 settled",
      "Large outflows mid-month (taxes, mortgage, loan gamma)",
    ],
  },
];

function loadJsonFixture(raw: unknown): EngineInput {
  return assertEngineInputShape(raw as EngineInput);
}

export const fixtures = {
  "basic-salary-rent": loadJsonFixture(basicSalaryRent),
  "credit-card-cycle": loadJsonFixture(creditCardCycle),
  "installment-plan": loadJsonFixture(installmentPlan),
  "recurrence-overrides": loadJsonFixture(recurrenceOverrides),
  "settlement-links": loadJsonFixture(settlementLinks),
  "household-june-2026": loadJsonFixture(householdJune2026),
} as const satisfies Record<string, EngineInput>;

export type FixtureId = keyof typeof fixtures;

export function getFixture(id: FixtureId): EngineInput {
  return fixtures[id];
}

export { assertEngineInputShape, brlToCents, brDateToIso } from "./helpers.js";
export { FIXTURE_SETTINGS } from "./settings.js";
