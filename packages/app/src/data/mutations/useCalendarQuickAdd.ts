import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesFor } from "@cashflow/core";
import type { QuickAddValues } from "@cashflow/ui";
import { queryKeys } from "../keys";
import { useSettings } from "../queries/useSettings";
import { submitCalendarQuickAdd } from "./calendarQuickAdd";
import { useAppClock } from "../../dev/useAppClock";

export function useCalendarQuickAdd(selectedDay?: string) {
  const queryClient = useQueryClient();
  const { today } = useAppClock();
  const asOfDate = selectedDay ?? today;
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
