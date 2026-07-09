import { useQuery } from "@tanstack/react-query";
import { creditCardStatementsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export function useStatements(cardAccountId: string | null) {
  const { today } = useAppClock();

  return useQuery({
    queryKey: [...queryKeys.creditCardStatements(cardAccountId ?? ""), today],
    queryFn: () => creditCardStatementsRepo.getByCardId(cardAccountId!),
    enabled: Boolean(cardAccountId),
  });
}
