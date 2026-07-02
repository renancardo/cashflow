import "@cashflow/ui/tokens/paper.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getDatabase, seedDatabase } from "@cashflow/db";
import { router } from "./router";
import { queryClient } from "./data/queryClient";

if (getDatabase().accounts.length === 0) {
  seedDatabase({
    accounts: [
      {
        id: "demo-cora",
        name: "Cora",
        type: "checking",
        currency: "BRL",
        isWorking: true,
        anchorBalanceCents: 500_000,
        anchorDate: "2026-06-01",
      },
    ],
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
