import "@cashflow/ui/tokens/paper.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { getDatabase } from "@cashflow/db";
import { router } from "./router";
import { queryClient } from "./data/queryClient";
import { bootstrapSeed } from "./data/seed/bootstrap";
import { AppClockProvider } from "./dev/AppClockProvider";

if (getDatabase().accounts.length === 0) {
  bootstrapSeed();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppClockProvider>
        <RouterProvider router={router} />
      </AppClockProvider>
    </QueryClientProvider>
  </StrictMode>,
);
