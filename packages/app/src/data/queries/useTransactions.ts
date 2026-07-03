import { useQuery } from "@tanstack/react-query";
import type { TxType } from "@cashflow/core";
import { accountsRepo, categoriesRepo, transactionsRepo } from "@cashflow/db";
import type { TransactionQuery } from "@cashflow/db";
import { queryKeys } from "../keys";

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
};

export type TransactionFilters = TransactionQuery;

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: queryKeys.transactions(filters),
    queryFn: async () => {
      const [transactions, accounts, categories] = await Promise.all([
        transactionsRepo.query(filters),
        accountsRepo.getAll(),
        categoriesRepo.getAll(),
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
