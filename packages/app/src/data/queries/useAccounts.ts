import { useQuery } from "@tanstack/react-query";
import { accountsRepo, getDatabase } from "@cashflow/db";
import { accountBalanceThrough, aggregateWorkingBalanceThrough } from "@cashflow/engine";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export function useAccounts() {
  const { today } = useAppClock();

  return useQuery({
    queryKey: [...queryKeys.accounts, today],
    queryFn: async () => {
      const accounts = await accountsRepo.getAll();
      const { transactions } = getDatabase();

      const rows = accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        isWorking: account.isWorking,
        anchorDate: account.anchorDate,
        balanceCents: accountBalanceThrough(account, transactions, today),
      }));

      const workingBalanceCents = aggregateWorkingBalanceThrough(accounts, transactions, today);

      return { accounts: rows, workingBalanceCents, rawAccounts: accounts };
    },
  });
}
