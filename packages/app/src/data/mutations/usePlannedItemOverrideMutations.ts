import { useMutation, useQueryClient } from "@tanstack/react-query";
import { plannedItemOverridesRepo } from "@cashflow/db";
import { queryKeys } from "../keys";

export function usePlannedItemOverrideMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plannedItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
  };

  const skipOccurrence = useMutation({
    mutationFn: ({
      plannedItemId,
      occurrenceDate,
    }: {
      plannedItemId: string;
      occurrenceDate: string;
    }) => plannedItemOverridesRepo.skipOccurrence(plannedItemId, occurrenceDate),
    onSuccess: invalidate,
  });

  return { skipOccurrence };
}
