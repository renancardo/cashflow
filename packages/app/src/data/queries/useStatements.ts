import { useQuery } from "@tanstack/react-query";
import { creditCardStatementsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";

export function useStatements(cardAccountId: string | null) {
  return useQuery({
    queryKey: queryKeys.creditCardStatements(cardAccountId ?? ""),
    queryFn: () => creditCardStatementsRepo.getByCardId(cardAccountId!),
    enabled: Boolean(cardAccountId),
  });
}
