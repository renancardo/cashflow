import { useQuery } from "@tanstack/react-query";
import {
  accountsRepo,
  categoriesRepo,
  creditCardStatementsRepo,
  listStatementCharges,
} from "@cashflow/db";
import { useAppClock } from "../../dev/useAppClock";

export function useStatementDetail(statementId: string | null) {
  const { today } = useAppClock();

  return useQuery({
    queryKey: ["statementDetail", statementId, today],
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
      const charges = listStatementCharges(statementId!, today).map((charge) => ({
        id: charge.id,
        source: charge.source,
        refId: charge.refId,
        description: charge.description,
        effectiveDate: charge.effectiveDate,
        amountCents: charge.amountCents,
        categoryName: charge.categoryId ? categoryNames.get(charge.categoryId) : undefined,
        isProjected: charge.isProjected,
        planId: charge.planId,
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
