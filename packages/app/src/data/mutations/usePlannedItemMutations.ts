import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PlannedItem, Recurrence } from "@cashflow/core";
import { dayBefore, isRecurring } from "@cashflow/core";
import {
  plannedItemsRepo,
  plannedItemOverridesRepo,
  settlePlannedItem,
  type PlannedItemInput,
} from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export type { PlannedItemInput };

export type PlannedItemEditorInput = {
  type: PlannedItem["type"];
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  recurrence: Recurrence;
  interval: number;
  dayOfMonth?: number;
  weekday?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  isSubscription: boolean;
  isActive: boolean;
};

export type RecurrenceScope = "this" | "future";

export function toPlannedItemPayload(input: PlannedItemEditorInput): PlannedItemInput {
  const isTransfer = input.type === "transfer";
  return {
    type: input.type,
    amountCents: Math.abs(input.amountCents),
    accountId: input.accountId,
    toAccountId: isTransfer ? input.toAccountId : undefined,
    categoryId: isTransfer ? undefined : input.categoryId,
    description: input.description.trim(),
    recurrence: input.recurrence,
    interval: Math.max(1, input.interval),
    dayOfMonth:
      input.recurrence === "monthly" || input.recurrence === "yearly"
        ? input.dayOfMonth
        : undefined,
    weekday: input.recurrence === "weekly" ? input.weekday : undefined,
    monthOfYear: input.recurrence === "yearly" ? input.monthOfYear : undefined,
    startDate: input.startDate,
    endDate: input.endDate || undefined,
    isSubscription: input.isSubscription,
    isActive: input.isActive,
  };
}

export function usePlannedItemMutations() {
  const queryClient = useQueryClient();
  const { today } = useAppClock();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plannedItems });
    queryClient.invalidateQueries({ queryKey: queryKeys.installmentPlans });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
  };

  const create = useMutation({
    mutationFn: (input: PlannedItemEditorInput) =>
      plannedItemsRepo.create(toPlannedItemPayload(input)),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlannedItemEditorInput }) =>
      plannedItemsRepo.update(id, toPlannedItemPayload(input)),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      plannedItemsRepo.setActive(id, isActive),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => plannedItemsRepo.delete(id),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => plannedItemsRepo.archive(id),
    onSuccess: invalidate,
  });

  const saveWithScope = useMutation({
    mutationFn: async ({
      id,
      input,
      scope,
      occurrenceDate,
      original,
    }: {
      id: string;
      input: PlannedItemEditorInput;
      scope: RecurrenceScope;
      occurrenceDate: string;
      original: PlannedItem;
    }) => {
      if (!isRecurring(original.recurrence)) {
        return plannedItemsRepo.update(id, toPlannedItemPayload(input));
      }

      if (scope === "this") {
        await plannedItemOverridesRepo.upsert({
          plannedItemId: id,
          occurrenceDate,
          status: "modified",
          amountCentsOverride:
            input.amountCents !== original.amountCents ? input.amountCents : undefined,
          dateOverride: input.startDate !== occurrenceDate ? input.startDate : undefined,
        });
        return original;
      }

      await plannedItemsRepo.update(id, { endDate: dayBefore(occurrenceDate) });
      return plannedItemsRepo.create({
        ...toPlannedItemPayload(input),
        startDate: occurrenceDate,
      });
    },
    onSuccess: invalidate,
  });

  const markPaid = useMutation({
    mutationFn: ({
      plannedItemId,
      occurrenceDate,
    }: {
      plannedItemId: string;
      occurrenceDate: string;
    }) => settlePlannedItem(plannedItemId, occurrenceDate, today),
    onSuccess: invalidate,
  });

  return { create, update, setActive, remove, archive, saveWithScope, markPaid };
}

export function createEmptyPlannedItemInput(
  today: string,
  defaultAccountId?: string,
): PlannedItemEditorInput {
  const day = Number(today.slice(8, 10));
  return {
    type: "expense",
    amountCents: 0,
    accountId: defaultAccountId ?? "",
    description: "",
    recurrence: "monthly",
    interval: 1,
    dayOfMonth: day,
    startDate: today,
    isSubscription: false,
    isActive: true,
  };
}
