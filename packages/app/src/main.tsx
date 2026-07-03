import "@cashflow/ui/tokens/paper.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getDatabase, seedDatabase } from "@cashflow/db";
import { router } from "./router";
import { queryClient } from "./data/queryClient";
import { SEED_ACCOUNTS } from "./data/seed/accounts";
import { SEED_CATEGORIES, SEED_CATEGORY_BUDGETS } from "./data/seed/categories";

if (getDatabase().accounts.length === 0) {
  seedDatabase({
    accounts: SEED_ACCOUNTS,
    categories: SEED_CATEGORIES,
    categoryBudgets: SEED_CATEGORY_BUDGETS,
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
