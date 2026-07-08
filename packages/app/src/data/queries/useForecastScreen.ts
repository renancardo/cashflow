import { useQuery } from "@tanstack/react-query";
import type { InstallmentPlan, PlannedItem, TxType } from "@cashflow/core";
import {
  buildPlannedSettlementSet,
  forecastSummaryMetrics,
  formatRecurrenceSummary,
  nextPlannedOccurrence,
  plannedItemGroup,
  previewUpcomingOccurrences,
  previewForecastSchedule,
} from "@cashflow/core";
import {
  accountsRepo,
  categoriesRepo,
  creditCardStatementsRepo,
  installmentPlansRepo,
  installmentsRepo,
  plannedItemOverridesRepo,
  plannedItemsRepo,
  transactionsRepo,
} from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export type ForecastFilter =
  "all" | "subscription" | "income" | "expense" | "transfer" | "installment" | "statement";

export type ForecastItemRowData = {
  id: string;
  type: TxType;
  amountCents: number;
  description: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  recurrenceSummary: string;
  group: "recurring" | "oneOff";
  nextDate?: string;
  nextAmountCents?: number;
  isSubscription: boolean;
  isActive: boolean;
  recurrence: PlannedItem["recurrence"];
  occurrences: {
    occurrenceDate: string;
    effectiveDate: string;
    amountCents: number;
    isSettled: boolean;
  }[];
};

export type InstallmentPlanRowData = {
  id: string;
  description: string;
  accountId: string;
  accountName: string;
  categoryId?: string;
  categoryName?: string;
  installmentAmountCents: number;
  paidCount: number;
  totalCount: number;
  progressPercent: number;
  payoffDate: string;
  nextDueDate?: string;
  nextDueAmountCents?: number;
  isActive: boolean;
  installments: {
    id: string;
    index: number;
    dueDate: string;
    amountCents: number;
    status: "scheduled" | "paid";
  }[];
};

export type CreditCardStatementRowData = {
  cardAccountId: string;
  cardName: string;
  payFromAccountName: string;
  lastDueDate?: string;
  nextDueDate?: string;
  nextPayAmountCents?: number;
  statements: {
    id: string;
    periodStart: string;
    closingDate: string;
    dueDate: string;
    computedTotalCents: number;
    plannedPaymentCents?: number;
    payAmountCents: number;
    status: "open" | "closed" | "paid";
    hasOverride: boolean;
  }[];
};

export type ForecastScreenData = {
  plannedRows: ForecastItemRowData[];
  installmentRows: InstallmentPlanRowData[];
  statementRows: CreditCardStatementRowData[];
  allStatementRows: CreditCardStatementRowData[];
  summary: ReturnType<typeof forecastSummaryMetrics>;
  accountOptions: { id: string; name: string }[];
  categoryOptions: { id: string; name: string; kind: "income" | "expense" }[];
  rawPlannedItems: PlannedItem[];
  rawInstallmentPlans: InstallmentPlan[];
  rawAccounts: Awaited<ReturnType<typeof accountsRepo.getAll>>;
  rawStatements: Awaited<ReturnType<typeof creditCardStatementsRepo.getAll>>;
};

function matchesPlannedFilter(row: ForecastItemRowData, filter: ForecastFilter): boolean {
  if (filter === "all" || filter === "installment" || filter === "statement") return true;
  if (filter === "subscription") return row.isSubscription;
  return row.type === filter;
}

function filterPlannedRows(
  rows: ForecastItemRowData[],
  filter: ForecastFilter,
): ForecastItemRowData[] {
  if (filter === "installment" || filter === "statement") return [];
  return rows.filter((row) => matchesPlannedFilter(row, filter));
}

export function useForecastScreen(filter: ForecastFilter = "all") {
  const { today } = useAppClock();

  return useQuery({
    queryKey: [...queryKeys.forecast, filter, today],
    queryFn: async () => {
      const asOfDate = today;
      const [
        plannedItems,
        overrides,
        installmentPlans,
        installments,
        transactions,
        accounts,
        categories,
        creditCardStatements,
      ] = await Promise.all([
        plannedItemsRepo.getAll(),
        plannedItemOverridesRepo.getAll(),
        installmentPlansRepo.getAll(),
        installmentsRepo.getAll(),
        transactionsRepo.getAll(),
        accountsRepo.getAll(),
        categoriesRepo.getAll(),
        creditCardStatementsRepo.getAll(),
      ]);

      const accountNames = new Map(accounts.map((a) => [a.id, a.name]));
      const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
      const settledPlanned = buildPlannedSettlementSet(transactions);

      const plannedRows: ForecastItemRowData[] = plannedItems.map((item) => {
        const next = nextPlannedOccurrence(item, overrides, settledPlanned, asOfDate);
        const occurrences = previewForecastSchedule(
          item,
          overrides,
          settledPlanned,
          asOfDate,
          5,
        ).map((occ) => ({
          occurrenceDate: occ.occurrenceDate,
          effectiveDate: occ.effectiveDate,
          amountCents: occ.amountCents,
          isSettled: occ.isSettled,
        }));
        return {
          id: item.id,
          type: item.type,
          amountCents: item.amountCents,
          description: item.description,
          accountId: item.accountId,
          accountName: accountNames.get(item.accountId) ?? "Unknown",
          toAccountId: item.toAccountId,
          toAccountName: item.toAccountId ? accountNames.get(item.toAccountId) : undefined,
          categoryId: item.categoryId,
          categoryName: item.categoryId ? categoryNames.get(item.categoryId) : undefined,
          recurrenceSummary: formatRecurrenceSummary(item),
          nextDate: item.isActive ? next?.effectiveDate : undefined,
          nextAmountCents: item.isActive ? next?.amountCents : undefined,
          isSubscription: item.isSubscription,
          isActive: item.isActive,
          recurrence: item.recurrence,
          group: plannedItemGroup(item.recurrence),
          occurrences,
        };
      });

      const installmentRows: InstallmentPlanRowData[] = installmentPlans.map((plan) => {
        const planInstallments = installments
          .filter((row) => row.installmentPlanId === plan.id)
          .sort((a, b) => a.index - b.index);
        const paidCount = planInstallments.filter((row) => row.status === "paid").length;
        const nextScheduled = planInstallments.find(
          (row) => row.status === "scheduled" && row.dueDate >= asOfDate,
        );

        return {
          id: plan.id,
          description: plan.description,
          accountId: plan.accountId,
          accountName: accountNames.get(plan.accountId) ?? "Unknown",
          categoryId: plan.categoryId,
          categoryName: plan.categoryId ? categoryNames.get(plan.categoryId) : undefined,
          installmentAmountCents: plan.installmentAmountCents,
          paidCount,
          totalCount: plan.installmentCount,
          progressPercent:
            plan.installmentCount === 0 ? 0 : Math.round((paidCount / plan.installmentCount) * 100),
          payoffDate: plan.payoffDate,
          nextDueDate: plan.isActive ? nextScheduled?.dueDate : undefined,
          nextDueAmountCents: plan.isActive
            ? nextScheduled
              ? (nextScheduled.amountCentsOverride ?? plan.installmentAmountCents)
              : undefined
            : undefined,
          isActive: plan.isActive,
          installments: planInstallments.map((row) => ({
            id: row.id,
            index: row.index,
            dueDate: row.dueDate,
            amountCents: row.amountCentsOverride ?? plan.installmentAmountCents,
            status: row.status,
          })),
        };
      });

      const statementRows: CreditCardStatementRowData[] = accounts
        .filter((account) => account.type === "credit_card" && !account.archivedAt)
        .map((card) => {
          const cardStatements = creditCardStatements
            .filter((row) => row.cardAccountId === card.id)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
          const nextUnpaid = cardStatements.find(
            (row) => row.status !== "paid" && !row.paymentTransactionId && row.dueDate >= asOfDate,
          );
          const defaultPayFromId =
            nextUnpaid?.payFromAccountId ??
            cardStatements.find((row) => row.payFromAccountId)?.payFromAccountId ??
            card.defaultPayFromAccountId;

          return {
            cardAccountId: card.id,
            cardName: card.name,
            payFromAccountName: defaultPayFromId
              ? (accountNames.get(defaultPayFromId) ?? "Unknown")
              : "—",
            lastDueDate: cardStatements.at(-1)?.dueDate,
            nextDueDate: nextUnpaid?.dueDate,
            nextPayAmountCents: nextUnpaid
              ? (nextUnpaid.plannedPaymentCents ?? nextUnpaid.computedTotalCents)
              : undefined,
            statements: cardStatements.map((row) => ({
              id: row.id,
              periodStart: row.periodStart,
              closingDate: row.closingDate,
              dueDate: row.dueDate,
              computedTotalCents: row.computedTotalCents,
              plannedPaymentCents: row.plannedPaymentCents,
              payAmountCents: row.plannedPaymentCents ?? row.computedTotalCents,
              status: row.status,
              hasOverride: row.plannedPaymentCents != null,
            })),
          };
        })
        .filter((row) => row.statements.length > 0);

      const summary = forecastSummaryMetrics({
        plannedItems,
        installmentPlans,
        installments,
        overrides,
        settledPlanned,
        asOfDate,
      });

      const filteredPlanned = filterPlannedRows(plannedRows, filter);
      const filteredInstallments =
        filter === "all" || filter === "installment" ? installmentRows : [];
      const filteredStatements = filter === "all" || filter === "statement" ? statementRows : [];

      return {
        plannedRows: filteredPlanned,
        installmentRows: filteredInstallments,
        statementRows: filteredStatements,
        allPlannedRows: plannedRows,
        allInstallmentRows: installmentRows,
        allStatementRows: statementRows,
        summary,
        accountOptions: accounts.map((a) => ({ id: a.id, name: a.name })),
        categoryOptions: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
        rawPlannedItems: plannedItems,
        rawInstallmentPlans: installmentPlans,
        rawAccounts: accounts,
        rawStatements: creditCardStatements,
        overrides,
        settledPlanned,
        asOfDate,
        previewOccurrences: (itemId: string, limit = 5) => {
          const item = plannedItems.find((row) => row.id === itemId);
          if (!item) return [];
          return previewUpcomingOccurrences(item, overrides, settledPlanned, asOfDate, limit);
        },
      } satisfies ForecastScreenData & {
        allPlannedRows: ForecastItemRowData[];
        allInstallmentRows: InstallmentPlanRowData[];
        allStatementRows: CreditCardStatementRowData[];
        overrides: typeof overrides;
        settledPlanned: typeof settledPlanned;
        asOfDate: string;
        previewOccurrences: (
          itemId: string,
          limit?: number,
        ) => ReturnType<typeof previewUpcomingOccurrences>;
      };
    },
  });
}
