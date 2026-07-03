import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todayIso } from "@cashflow/core";
import type { QuickAddValues } from "@cashflow/ui";
import { queryKeys } from "../keys";
import { submitCalendarQuickAdd } from "./calendarQuickAdd";

export function useCalendarQuickAdd(asOfDate: string = todayIso()) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plannedItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
  };

  return useMutation({
    mutationFn: (values: QuickAddValues) => submitCalendarQuickAdd(values, asOfDate),
    onSuccess: invalidate,
  });
}
