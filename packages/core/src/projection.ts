import type {
  Account,
  CreditCardStatement,
  Installment,
  InstallmentPlan,
  PlannedItem,
  PlannedItemOverride,
  Settings,
  Transaction,
} from "./entities.js";

export type ProjectionItemSource = "transaction" | "planned" | "installment" | "statement_payment";

export interface ProjectionItem {
  source: ProjectionItemSource;
  refId: string;
  type: "income" | "expense" | "transfer";
  amountCents: number;
  accountId: string;
  categoryId?: string;
  description: string;
  isProjected: boolean;
}

export interface ProjectionDay {
  date: string;
  openingBalanceCents: number;
  inflowsCents: number;
  outflowsCents: number;
  closingBalanceCents: number;
  belowBuffer: boolean;
  largeOutflow: boolean;
  items: ProjectionItem[];
}

export interface ProjectionResult {
  days: ProjectionDay[];
  nextNegativeDate: string | null;
  workingBalanceTodayCents: number;
}

/** All persisted inputs required by the projection engine. */
export interface EngineInput {
  accounts: Account[];
  transactions: Transaction[];
  plannedItems: PlannedItem[];
  plannedItemOverrides: PlannedItemOverride[];
  creditCardStatements: CreditCardStatement[];
  installments: Installment[];
  installmentPlans: InstallmentPlan[];
  settings: Settings;
}
