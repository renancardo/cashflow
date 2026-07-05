import { useQuery } from "@tanstack/react-query";
import { todayIso } from "@cashflow/core";
import {
  accountsRepo,
  categoriesRepo,
  creditCardStatementsRepo,
  listStatementCharges,
} from "@cashflow/db";

export function useStatementDetail(statementId: string | null) {
  return useQuery({
    queryKey: ["statementDetail", statementId],
    queryFn: async () => {
      const [statement, accounts, categories] = await Promise.all([
        creditCardStatementsRepo.getById(statementId!),
        accountsRepo.getAll(),
        categoriesRepo.getAll(),
      ]);

      if (!statement) {
        throw new Error(`Statement not found: ${statementId}`);
      }

      const card = accounts.find((row) => row.id === statement.cardAccountId);
      const categoryNames = new Map(categories.map((row) => [row.id, row.name]));
      const charges = listStatementCharges(statementId!, todayIso()).map((charge) => ({
        id: charge.id,
        source: charge.source,
        description: charge.description,
        effectiveDate: charge.effectiveDate,
        amountCents: charge.amountCents,
        categoryName: charge.categoryId ? categoryNames.get(charge.categoryId) : undefined,
        isProjected: charge.isProjected,
      }));

      return {
        statement,
        cardName: card?.name ?? "Credit card",
        charges,
      };
    },
    enabled: Boolean(statementId),
  });
}
