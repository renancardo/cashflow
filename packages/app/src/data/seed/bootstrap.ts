import {
  getDatabase,
  materializeAllCreditCardStatements,
  recomputeAllStatementTotals,
  seedDatabase,
} from "@cashflow/db";
import { SEED_ACCOUNTS } from "./accounts";
import { SEED_CATEGORIES, SEED_CATEGORY_BUDGETS } from "./categories";
import { SEED_INSTALLMENTS, SEED_INSTALLMENT_PLANS } from "./installmentPlans";
import { SEED_PLANNED_ITEMS } from "./plannedItems";
import { SEED_TRANSACTIONS } from "./transactions";

/** Matches seed materialization in main.tsx / bootstrapSeed(). */
export const SEED_ANCHOR_DATE = "2026-06-28";

export function bootstrapSeed(asOfDate: string = SEED_ANCHOR_DATE): void {
  seedDatabase({
    accounts: SEED_ACCOUNTS,
    categories: SEED_CATEGORIES,
    categoryBudgets: SEED_CATEGORY_BUDGETS,
    transactions: SEED_TRANSACTIONS,
    plannedItems: SEED_PLANNED_ITEMS,
    installmentPlans: SEED_INSTALLMENT_PLANS,
    installments: SEED_INSTALLMENTS,
  });
  materializeAllCreditCardStatements(asOfDate);

  const db = getDatabase();
  const openingStatement = db.creditCardStatements.find(
    (row) => row.cardAccountId === "acct-cora-card" && row.dueDate === "2026-07-03",
  );
  const cardPayment = db.transactions.find((row) => row.id === "tx-card-payment");
  if (openingStatement && cardPayment && !cardPayment.paysStatementId) {
    // Seed payment was authored as the opening-debt amount only; the June fatura also
    // includes Netflix + Spotify. Pay the full computed total so the next statement
    // does not silently carry an underpayment that only appears after a recompute.
    const paidCents = openingStatement.computedTotalCents;
    cardPayment.paysStatementId = openingStatement.id;
    cardPayment.amountCents = paidCents;
    openingStatement.status = "paid";
    openingStatement.paymentTransactionId = cardPayment.id;
    openingStatement.paidAmountCents = paidCents;
    recomputeAllStatementTotals(asOfDate);
  }
}
