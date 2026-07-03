import { useQuery } from "@tanstack/react-query";
import type { TxType } from "@cashflow/core";
import {
  accountsRepo,
  categoriesRepo,
  getDatabase,
  installmentPlansRepo,
  installmentsRepo,
  plannedItemsRepo,
  transactionsRepo,
} from "@cashflow/db";
import type { TransactionQuery } from "@cashflow/db";
import { queryKeys } from "../keys";

export type TransactionSettlement = {
  kind: "planned" | "installment" | "statement";
  label: string;
};

export type TransactionRowData = {
  id: string;
  type: TxType;
  amountCents: number;
  description: string;
  effectiveDate: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  categoryId?: string;
  categoryName?: string;
  settlement?: TransactionSettlement;
};

export type TransactionFilters = TransactionQuery;

function resolveSettlement(
  tx: Awaited<ReturnType<typeof transactionsRepo.getAll>>[number],
  plannedItems: Awaited<ReturnType<typeof plannedItemsRepo.getAll>>,
  installmentPlans: Awaited<ReturnType<typeof installmentPlansRepo.getAll>>,
  installments: Awaited<ReturnType<typeof installmentsRepo.getAll>>,
): TransactionSettlement | undefined {
  if (tx.settlesPlannedItemId) {
    const item = plannedItems.find((row) => row.id === tx.settlesPlannedItemId);
    return { kind: "planned", label: item?.description ?? "Planned item" };
  }
  if (tx.settlesInstallmentId) {
    const installment = installments.find((row) => row.id === tx.settlesInstallmentId);
    const plan = installment
      ? installmentPlans.find((row) => row.id === installment.installmentPlanId)
      : undefined;
    return { kind: "installment", label: plan?.description ?? "Installment" };
  }
  if (tx.paysStatementId) {
    const statement = getDatabase().creditCardStatements.find(
      (row) => row.id === tx.paysStatementId,
    );
    return {
      kind: "statement",
      label: statement ? `Statement ${statement.periodStart}` : "Statement",
    };
  }
  return undefined;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const [transactions, accounts, categories, plannedItems, installmentPlans, installments] =
        await Promise.all([
          transactionsRepo.query(filters),
          accountsRepo.getAll(),
          categoriesRepo.getAll(),
          plannedItemsRepo.getAll(),
          installmentPlansRepo.getAll(),
          installmentsRepo.getAll(),
        ]);

      const accountNames = new Map(accounts.map((a) => [a.id, a.name]));
      const categoryNames = new Map(categories.map((c) => [c.id, c.name]));

      const rows: TransactionRowData[] = transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amountCents: tx.amountCents,
        description: tx.description,
        effectiveDate: tx.effectiveDate,
        accountId: tx.accountId,
        accountName: accountNames.get(tx.accountId) ?? "Unknown",
        toAccountId: tx.toAccountId,
        toAccountName: tx.toAccountId ? accountNames.get(tx.toAccountId) : undefined,
        categoryId: tx.categoryId,
        categoryName: tx.categoryId ? categoryNames.get(tx.categoryId) : undefined,
        settlement: resolveSettlement(tx, plannedItems, installmentPlans, installments),
      }));

      return {
        rows,
        totalCount: rows.length,
        rawTransactions: transactions,
        accounts: accounts.map((a) => ({ id: a.id, name: a.name })),
        categories: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
      };
    },
  });
}
