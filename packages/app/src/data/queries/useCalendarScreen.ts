import { useQuery } from "@tanstack/react-query";
import { projectCashFlow } from "@cashflow/engine";
import { categoriesRepo, loadEngineInput } from "@cashflow/db";
import { todayIso } from "@cashflow/core";
import { queryKeys } from "../keys";

export function useCalendarScreen(asOfDate: string = todayIso()) {
  return useQuery({
    queryKey: [...queryKeys.projection(asOfDate), "calendar"],
    queryFn: async () => {
      const [input, categories] = await Promise.all([loadEngineInput(), categoriesRepo.getAll()]);
      const projection = projectCashFlow(input, asOfDate);

      const accountNames = new Map(input.accounts.map((account) => [account.id, account.name]));
      const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

      const transactionById = new Map(input.transactions.map((tx) => [tx.id, tx]));
      const plannedById = new Map(input.plannedItems.map((item) => [item.id, item]));

      return {
        projection,
        settings: input.settings,
        today: asOfDate,
        accountOptions: input.accounts.map((account) => ({
          id: account.id,
          name: account.name,
          type: account.type,
        })),
        categoryOptions: categories.map((category) => ({
          id: category.id,
          name: category.name,
          kind: category.kind,
        })),
        resolveItemMeta(item: (typeof projection.days)[number]["items"][number]) {
          const accountName = accountNames.get(item.accountId) ?? "Unknown";
          const categoryName = item.categoryId ? categoryNames.get(item.categoryId) : undefined;

          let toAccountName: string | undefined;
          if (item.type === "transfer") {
            if (item.source === "transaction") {
              toAccountName = transactionById.get(item.refId)?.toAccountId
                ? accountNames.get(transactionById.get(item.refId)!.toAccountId!)
                : undefined;
            } else if (item.source === "planned") {
              toAccountName = plannedById.get(item.refId)?.toAccountId
                ? accountNames.get(plannedById.get(item.refId)!.toAccountId!)
                : undefined;
            }
          }

          return { accountName, categoryName, toAccountName };
        },
      };
    },
  });
}
