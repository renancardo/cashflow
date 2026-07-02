import type {
  Account,
  Category,
  CategoryBudget,
  CreditCardStatement,
  Installment,
  InstallmentPlan,
  PlannedItem,
  PlannedItemOverride,
  Settings,
  Transaction,
} from "@cashflow/core";
import { DEFAULT_SETTINGS } from "@cashflow/core";

export interface DatabaseState {
  accounts: Account[];
  categories: Category[];
  categoryBudgets: CategoryBudget[];
  transactions: Transaction[];
  plannedItems: PlannedItem[];
  plannedItemOverrides: PlannedItemOverride[];
  creditCardStatements: CreditCardStatement[];
  installmentPlans: InstallmentPlan[];
  installments: Installment[];
  settings: Settings;
}

export function createEmptyState(): DatabaseState {
  return {
    accounts: [],
    categories: [],
    categoryBudgets: [],
    transactions: [],
    plannedItems: [],
    plannedItemOverrides: [],
    creditCardStatements: [],
    installmentPlans: [],
    installments: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

let state: DatabaseState = createEmptyState();

export function getDatabase(): DatabaseState {
  return state;
}

export function resetDatabase(next: DatabaseState = createEmptyState()): void {
  state = next;
}

export function seedDatabase(next: Partial<DatabaseState>): void {
  state = { ...createEmptyState(), ...next, settings: next.settings ?? { ...DEFAULT_SETTINGS } };
}
