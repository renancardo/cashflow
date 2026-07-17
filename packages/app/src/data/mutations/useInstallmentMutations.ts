import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InstallmentPlan } from "@cashflow/core";
import {
  installmentPlansRepo,
  installmentsRepo,
  settleInstallment,
  type InstallmentPlanInput,
} from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export type { InstallmentPlanInput };

export type InstallmentPlanEditorInput = {
  description: string;
  accountId: string;
  categoryId?: string;
  installmentAmountCents: number;
  installmentCount: number;
  firstDueDate: string;
  dayOfMonth: number;
  isActive: boolean;
};

function toInstallmentPlanPayload(input: InstallmentPlanEditorInput): InstallmentPlanInput {
  return {
    description: input.description.trim(),
    accountId: input.accountId,
    categoryId: input.categoryId,
    installmentAmountCents: Math.abs(input.installmentAmountCents),
    installmentCount: Math.max(1, input.installmentCount),
    firstDueDate: input.firstDueDate,
    dayOfMonth: input.dayOfMonth,
    isActive: input.isActive,
  };
}

export function useInstallmentMutations() {
  const queryClient = useQueryClient();
  const { today } = useAppClock();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.installmentPlans });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
    queryClient.invalidateQueries({ queryKey: ["creditCardStatements"] });
    queryClient.invalidateQueries({ queryKey: ["statementDetail"] });
  };

  const create = useMutation({
    mutationFn: (input: InstallmentPlanEditorInput) =>
      installmentPlansRepo.create(toInstallmentPlanPayload(input)),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: InstallmentPlanEditorInput }) =>
      installmentPlansRepo.update(id, toInstallmentPlanPayload(input)),
    onSuccess: invalidate,
  });

  const setActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      installmentPlansRepo.setActive(id, isActive),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => installmentPlansRepo.delete(id),
    onSuccess: invalidate,
  });

  const markPaid = useMutation({
    mutationFn: ({
      installmentId,
      effectiveDate,
    }: {
      installmentId: string;
      effectiveDate?: string;
    }) => settleInstallment(installmentId, effectiveDate ?? today),
    onSuccess: invalidate,
  });

  /** Zero out an installment so it no longer contributes to statement totals. */
  const removeCharge = useMutation({
    mutationFn: (installmentId: string) => installmentsRepo.setAmountOverride(installmentId, 0),
    onSuccess: invalidate,
  });

  return { create, update, setActive, remove, markPaid, removeCharge };
}

export function createEmptyInstallmentPlanInput(
  today: string,
  defaultAccountId?: string,
): InstallmentPlanEditorInput {
  const day = Number(today.slice(8, 10));
  return {
    description: "",
    accountId: defaultAccountId ?? "",
    installmentAmountCents: 0,
    installmentCount: 12,
    firstDueDate: today,
    dayOfMonth: day,
    isActive: true,
  };
}

export function toInstallmentEditorValues(plan: InstallmentPlan): InstallmentPlanEditorInput {
  return {
    description: plan.description,
    accountId: plan.accountId,
    categoryId: plan.categoryId,
    installmentAmountCents: plan.installmentAmountCents,
    installmentCount: plan.installmentCount,
    firstDueDate: plan.firstDueDate,
    dayOfMonth: plan.dayOfMonth,
    isActive: plan.isActive,
  };
}
