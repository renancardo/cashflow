import "@cashflow/ui/tokens/paper.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getDatabase, materializeAllCreditCardStatements, seedDatabase } from "@cashflow/db";
import { router } from "./router";
import { queryClient } from "./data/queryClient";
import { SEED_ACCOUNTS } from "./data/seed/accounts";
import { SEED_CATEGORIES, SEED_CATEGORY_BUDGETS } from "./data/seed/categories";
import { SEED_INSTALLMENTS, SEED_INSTALLMENT_PLANS } from "./data/seed/installmentPlans";
import { SEED_PLANNED_ITEMS } from "./data/seed/plannedItems";
import { SEED_TRANSACTIONS } from "./data/seed/transactions";

if (getDatabase().accounts.length === 0) {
  seedDatabase({
    accounts: SEED_ACCOUNTS,
    categories: SEED_CATEGORIES,
    categoryBudgets: SEED_CATEGORY_BUDGETS,
    transactions: SEED_TRANSACTIONS,
    plannedItems: SEED_PLANNED_ITEMS,
    installmentPlans: SEED_INSTALLMENT_PLANS,
    installments: SEED_INSTALLMENTS,
  });
  materializeAllCreditCardStatements("2026-06-28");

  const db = getDatabase();
  const openingStatement = db.creditCardStatements.find(
    (row) => row.cardAccountId === "acct-cora-card" && row.dueDate === "2026-07-03",
  );
  const cardPayment = db.transactions.find((row) => row.id === "tx-card-payment");
  if (openingStatement && cardPayment && !cardPayment.paysStatementId) {
    cardPayment.paysStatementId = openingStatement.id;
    openingStatement.status = "paid";
    openingStatement.paymentTransactionId = cardPayment.id;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
