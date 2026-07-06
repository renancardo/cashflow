import { DEFAULT_SETTINGS } from "@cashflow/core";
import {
  createEmptyState,
  getDatabase,
  resetDatabase,
  type DatabaseState,
} from "./in-memory/database.js";

export const BACKUP_VERSION = 1;

export type DatabaseBackup = DatabaseState & {
  version: number;
  exportedAt: string;
};

export function exportDatabase(): DatabaseBackup {
  const db = getDatabase();
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    accounts: db.accounts.map((row) => ({ ...row })),
    categories: db.categories.map((row) => ({ ...row })),
    categoryBudgets: db.categoryBudgets.map((row) => ({ ...row })),
    transactions: db.transactions.map((row) => ({ ...row })),
    plannedItems: db.plannedItems.map((row) => ({ ...row })),
    plannedItemOverrides: db.plannedItemOverrides.map((row) => ({ ...row })),
    creditCardStatements: db.creditCardStatements.map((row) => ({ ...row })),
    installmentPlans: db.installmentPlans.map((row) => ({ ...row })),
    installments: db.installments.map((row) => ({ ...row })),
    settings: { ...db.settings },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function parseBackupJson(text: string): unknown {
  return JSON.parse(text) as unknown;
}

export function validateBackup(data: unknown): data is DatabaseBackup {
  if (!isRecord(data)) return false;
  if (typeof data.version !== "number") return false;
  if (typeof data.exportedAt !== "string") return false;
  if (!isArray(data.accounts)) return false;
  if (!isArray(data.categories)) return false;
  if (!isArray(data.categoryBudgets)) return false;
  if (!isArray(data.transactions)) return false;
  if (!isArray(data.plannedItems)) return false;
  if (!isArray(data.plannedItemOverrides)) return false;
  if (!isArray(data.creditCardStatements)) return false;
  if (!isArray(data.installmentPlans)) return false;
  if (!isArray(data.installments)) return false;
  if (!isRecord(data.settings)) return false;
  return true;
}

export function restoreDatabase(backup: DatabaseBackup): void {
  resetDatabase({
    accounts: backup.accounts,
    categories: backup.categories,
    categoryBudgets: backup.categoryBudgets,
    transactions: backup.transactions,
    plannedItems: backup.plannedItems,
    plannedItemOverrides: backup.plannedItemOverrides,
    creditCardStatements: backup.creditCardStatements,
    installmentPlans: backup.installmentPlans,
    installments: backup.installments,
    settings: { ...DEFAULT_SETTINGS, ...backup.settings, id: "singleton" },
  });
}

export function createEmptyBackup(): DatabaseBackup {
  const empty = createEmptyState();
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...empty,
  };
}
