import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesFor, todayIso } from "@cashflow/core";
import type { QuickAddValues } from "@cashflow/ui";
import { queryKeys } from "../keys";
import { useSettings } from "../queries/useSettings";
import { submitCalendarQuickAdd } from "./calendarQuickAdd";

export function useCalendarQuickAdd(asOfDate: string = todayIso()) {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const defaultDescription = messagesFor(settings?.language ?? "pt-BR").quickAdd.defaultDescription;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plannedItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
  };

  return useMutation({
    mutationFn: (values: QuickAddValues) =>
      submitCalendarQuickAdd(values, asOfDate, defaultDescription),
    onSuccess: invalidate,
  });
}
