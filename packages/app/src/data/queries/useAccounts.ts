import { useQuery } from "@tanstack/react-query";
import { accountsRepo, getDatabase } from "@cashflow/db";
import { accountBalanceThrough, aggregateWorkingBalanceThrough } from "@cashflow/engine";
import { todayIso } from "@cashflow/core";
import { queryKeys } from "../keys";

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => {
      const accounts = await accountsRepo.getAll();
      const { transactions } = getDatabase();
      const asOfDate = todayIso();

      const rows = accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        isWorking: account.isWorking,
        anchorDate: account.anchorDate,
        balanceCents: accountBalanceThrough(account, transactions, asOfDate),
      }));

      const workingBalanceCents = aggregateWorkingBalanceThrough(accounts, transactions, asOfDate);

      return { accounts: rows, workingBalanceCents, rawAccounts: accounts };
    },
  });
}
