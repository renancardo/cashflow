import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dayDetailSettleKeyFromRequest, type DayDetailSettleRequest } from "@cashflow/ui";
import { settleInstallment, settlePlannedItem, settleStatement } from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export function useDayDetailSettle() {
  const queryClient = useQueryClient();
  const { today } = useAppClock();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plannedItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.installmentPlans });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
    queryClient.invalidateQueries({ queryKey: ["creditCardStatements"] });
    queryClient.invalidateQueries({ queryKey: ["statementDetail"] });
  };

  const settle = useMutation({
    mutationFn: async (request: DayDetailSettleRequest) => {
      if (request.source === "planned") {
        return settlePlannedItem(request.plannedItemId, request.occurrenceDate, today);
      }
      if (request.source === "installment") {
        return settleInstallment(request.installmentId, today);
      }
      return settleStatement(request.statementId, today);
    },
    onSuccess: invalidate,
  });

  return {
    settle: settle.mutateAsync,
    settlingKey: settle.isPending && settle.variables ? dayDetailSettleKeyFromRequest(settle.variables) : null,
    isSettling: settle.isPending,
  };
}
