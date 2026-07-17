import type { StatementListRow } from "../organisms/StatementListPanel/StatementListPanel.js";

/** Demo rows based on packages/engine/fixtures/credit-card-cycle.json, extended for UI states. */
export const DEMO_STATEMENT_ROWS: StatementListRow[] = [
  {
    id: "stmt-jun-jul",
    periodStart: "2026-05-27",
    closingDate: "2026-06-26",
    dueDate: "2026-07-01",
    computedTotalCents: 150_000,
    paidAmountCents: 150_000,
    status: "paid",
    paymentTransactionId: "tx-card-payment",
  },
  {
    id: "stmt-jul-aug",
    periodStart: "2026-06-27",
    closingDate: "2026-07-26",
    dueDate: "2026-08-01",
    computedTotalCents: 158_990,
    plannedPaymentCents: 100_000,
    status: "open",
  },
  {
    id: "stmt-aug-sep",
    periodStart: "2026-07-27",
    closingDate: "2026-08-26",
    dueDate: "2026-09-01",
    computedTotalCents: 89_000,
    status: "open",
  },
];

export const DEMO_STATEMENT_CARD_NAME = "Main Credit Card";
