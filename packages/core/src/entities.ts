export type AccountType = "checking" | "savings" | "wallet" | "credit_card" | "investment";
export type CategoryKind = "income" | "expense";
export type TxType = "income" | "expense" | "transfer";
export type Recurrence = "once" | "weekly" | "monthly" | "yearly";
export type OverrideStatus = "modified" | "skipped";
export type StatementStatus = "open" | "closed" | "paid" | "partially_paid";
export type InstallmentStatus = "scheduled" | "paid";
export type Language = "pt-BR" | "en";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  isWorking: boolean;
  anchorBalanceCents: number;
  anchorDate: string;
  creditLimitCents?: number;
  closingDay?: number;
  dueDay?: number;
  defaultPayFromAccountId?: string;
  institution?: string;
  agency?: string;
  pixKey?: string;
  notes?: string;
  archivedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId?: string;
  color?: string;
  archivedAt?: string;
}

export interface CategoryBudget {
  id: string;
  categoryId: string;
  amountCents: number;
  effectiveFromMonth: string;
  archivedAt?: string;
}

export interface Transaction {
  id: string;
  type: TxType;
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  effectiveDate: string;
  /** Display order within the same effectiveDate (lower = higher in newest-first list). */
  sortOrder: number;
  settlesPlannedItemId?: string;
  settlesPlannedOccurrenceDate?: string;
  settlesInstallmentId?: string;
  paysStatementId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlannedItem {
  id: string;
  type: TxType;
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  recurrence: Recurrence;
  interval: number;
  dayOfMonth?: number;
  weekday?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  isSubscription: boolean;
  isActive: boolean;
  archivedAt?: string;
}

export interface PlannedItemOverride {
  id: string;
  plannedItemId: string;
  occurrenceDate: string;
  status: OverrideStatus;
  amountCentsOverride?: number;
  dateOverride?: string;
  note?: string;
}

export interface CreditCardStatement {
  id: string;
  cardAccountId: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  computedTotalCents: number;
  plannedPaymentCents?: number;
  /** Actual amount paid toward this statement (partial or full). */
  paidAmountCents?: number;
  payFromAccountId?: string;
  status: StatementStatus;
  paymentTransactionId?: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  accountId: string;
  categoryId?: string;
  installmentAmountCents: number;
  installmentCount: number;
  firstDueDate: string;
  dayOfMonth: number;
  payoffDate: string;
  isActive: boolean;
  archivedAt?: string;
}

export interface Installment {
  id: string;
  installmentPlanId: string;
  index: number;
  dueDate: string;
  amountCentsOverride?: number;
  status: InstallmentStatus;
  settledTransactionId?: string;
}

export interface Settings {
  id: "singleton";
  language: Language;
  defaultCurrency: string;
  negativeBufferCents: number;
  largeOutflowThresholdCents: number;
  horizonMonths: number;
  alertLeadTimeDays: number;
  defaultWorkingForType: Partial<Record<AccountType, boolean>>;
  dateFormat: string;
}
