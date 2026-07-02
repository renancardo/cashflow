import type { EngineInput } from "@cashflow/core";
import { getDatabase } from "./in-memory/database.js";

export async function loadEngineInput(): Promise<EngineInput> {
  const db = getDatabase();

  return {
    accounts: db.accounts.filter((a) => !a.archivedAt),
    transactions: [...db.transactions],
    plannedItems: db.plannedItems.filter((p) => !p.archivedAt),
    plannedItemOverrides: [...db.plannedItemOverrides],
    creditCardStatements: [...db.creditCardStatements],
    installments: [...db.installments],
    installmentPlans: db.installmentPlans.filter((p) => !p.archivedAt),
    settings: { ...db.settings },
  };
}
