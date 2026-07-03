import type { ForecastItemRowData } from "../organisms/ForecastItemRow/ForecastItemRow.js";
import type { InstallmentPlanRowData } from "../organisms/InstallmentPlanRow/InstallmentPlanRow.js";
import type { ForecastSummary } from "../organisms/ForecastScreen/ForecastScreen.js";
import { DEMO_WORKING_BALANCE_CENTS } from "./accounts.js";

export const DEMO_FORECAST_SUMMARY: ForecastSummary = {
  activeItemCount: 8,
  subscriptionCount: 2,
  nextOutflow: { date: "2026-07-05", amountCents: 55_90 },
  nextInflow: { date: "2026-07-05", amountCents: 850_000 },
};

export const DEMO_PLANNED_ROWS: ForecastItemRowData[] = [
  {
    id: "plan-salary",
    type: "income",
    amountCents: 850_000,
    description: "Salary — Acme Corp",
    accountName: "Cora Checking",
    categoryName: "Salary",
    recurrenceSummary: "Monthly · day 5",
    group: "recurring",
    nextDate: "2026-07-05",
    nextAmountCents: 850_000,
    isSubscription: false,
    isActive: true,
    occurrences: [
      { occurrenceDate: "2026-07-05", effectiveDate: "2026-07-05", amountCents: 850_000 },
      { occurrenceDate: "2026-08-05", effectiveDate: "2026-08-05", amountCents: 850_000 },
    ],
  },
  {
    id: "plan-rent",
    type: "expense",
    amountCents: 240_000,
    description: "Aluguel",
    accountName: "Cora Checking",
    categoryName: "Housing",
    recurrenceSummary: "Monthly · day 10",
    group: "recurring",
    nextDate: "2026-07-10",
    nextAmountCents: 240_000,
    isSubscription: false,
    isActive: true,
    occurrences: [
      { occurrenceDate: "2026-07-10", effectiveDate: "2026-07-10", amountCents: 240_000 },
    ],
  },
  {
    id: "plan-netflix",
    type: "expense",
    amountCents: 5_590,
    description: "Netflix",
    accountName: "Cartão Cora",
    categoryName: "Entertainment",
    recurrenceSummary: "Monthly · day 15",
    group: "recurring",
    nextDate: "2026-07-15",
    nextAmountCents: 5_590,
    isSubscription: true,
    isActive: true,
    occurrences: [
      { occurrenceDate: "2026-07-15", effectiveDate: "2026-07-15", amountCents: 5_590 },
    ],
  },
  {
    id: "plan-investment",
    type: "transfer",
    amountCents: 500_000,
    description: "Investment — XP",
    accountName: "Cora Checking",
    toAccountName: "XP Investimentos",
    recurrenceSummary: "Once · 15/08/2026",
    group: "oneOff",
    nextDate: "2026-08-15",
    nextAmountCents: 500_000,
    isSubscription: false,
    isActive: true,
    occurrences: [
      { occurrenceDate: "2026-08-15", effectiveDate: "2026-08-15", amountCents: 500_000 },
    ],
  },
  {
    id: "plan-tim",
    type: "expense",
    amountCents: 8_990,
    description: "TIM — plano antigo",
    accountName: "Cora Checking",
    categoryName: "Utilities",
    recurrenceSummary: "Monthly · day 12",
    group: "recurring",
    isSubscription: false,
    isActive: false,
    occurrences: [],
  },
];

export const DEMO_INSTALLMENT_ROWS: InstallmentPlanRowData[] = [
  {
    id: "plan-ipanema",
    description: "Ipanema",
    accountName: "Cora Checking",
    categoryName: "Debt",
    paidCount: 12,
    totalCount: 36,
    progressPercent: 33,
    payoffDate: "2028-08-10",
    nextDueDate: "2026-07-10",
    nextDueAmountCents: 47_500,
    isActive: true,
    installments: [
      { id: "i-11", index: 11, dueDate: "2026-06-10", amountCents: 47_500, status: "paid" },
      { id: "i-12", index: 12, dueDate: "2026-07-10", amountCents: 47_500, status: "paid" },
      { id: "i-13", index: 13, dueDate: "2026-08-10", amountCents: 47_500, status: "scheduled" },
    ],
  },
];

export { DEMO_WORKING_BALANCE_CENTS };
