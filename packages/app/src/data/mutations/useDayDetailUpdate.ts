import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  creditCardStatementsRepo,
  installmentPlansRepo,
  installmentsRepo,
  plannedItemOverridesRepo,
  plannedItemsRepo,
  transactionsRepo,
} from "@cashflow/db";
import type { DayDetailAmountUpdateRequest, DayDetailDescriptionUpdateRequest } from "@cashflow/ui";
import { queryKeys } from "../keys";
import { type TransactionInput, useTransactionMutations } from "./useTransactionMutations";

function toTransactionInput(
  tx: Awaited<ReturnType<typeof transactionsRepo.getById>>,
): TransactionInput {
  if (!tx) {
    throw new Error("Transaction not found");
  }

  return {
    type: tx.type,
    amountCents: tx.amountCents,
    accountId: tx.accountId,
    toAccountId: tx.toAccountId,
    categoryId: tx.categoryId,
    description: tx.description,
    effectiveDate: tx.effectiveDate,
  };
}

export function useDayDetailUpdate() {
  const queryClient = useQueryClient();
  const { update: updateTransaction } = useTransactionMutations();

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

  const updateAmount = useMutation({
    mutationFn: async ({ itemKey: _itemKey, ...request }: DayDetailAmountUpdateRequest) => {
      switch (request.source) {
        case "transaction": {
          const tx = await transactionsRepo.getById(request.transactionId);
          const input = toTransactionInput(tx);
          return updateTransaction.mutateAsync({
            id: request.transactionId,
            input: { ...input, amountCents: request.amountCents },
          });
        }
        case "planned":
          return plannedItemOverridesRepo.upsert({
            plannedItemId: request.plannedItemId,
            occurrenceDate: request.occurrenceDate,
            status: "modified",
            amountCentsOverride: request.amountCents,
          });
        case "installment":
          return installmentsRepo.setAmountOverride(request.installmentId, request.amountCents);
        case "statement_payment":
          return creditCardStatementsRepo.update(request.statementId, {
            plannedPaymentCents: request.amountCents,
          });
      }
    },
    onSuccess: invalidate,
  });

  const updateDescription = useMutation({
    mutationFn: async ({ itemKey: _itemKey, ...request }: DayDetailDescriptionUpdateRequest) => {
      switch (request.source) {
        case "transaction": {
          const tx = await transactionsRepo.getById(request.transactionId);
          const input = toTransactionInput(tx);
          return updateTransaction.mutateAsync({
            id: request.transactionId,
            input: { ...input, description: request.description },
          });
        }
        case "planned": {
          const item = await plannedItemsRepo.getById(request.plannedItemId);
          if (!item) throw new Error(`PlannedItem not found: ${request.plannedItemId}`);
          return plannedItemsRepo.update(request.plannedItemId, {
            description: request.description,
          });
        }
        case "installment": {
          const installment = await installmentsRepo.getById(request.installmentId);
          if (!installment) throw new Error(`Installment not found: ${request.installmentId}`);
          const plan = await installmentPlansRepo.getById(installment.installmentPlanId);
          if (!plan) throw new Error(`InstallmentPlan not found: ${installment.installmentPlanId}`);
          return installmentPlansRepo.update(plan.id, { description: request.description });
        }
      }
    },
    onSuccess: invalidate,
  });

  const pending = updateAmount.isPending
    ? updateAmount.variables
    : updateDescription.isPending
      ? updateDescription.variables
      : null;

  return {
    updateAmount: updateAmount.mutateAsync,
    updateDescription: updateDescription.mutateAsync,
    updatingKey: pending?.itemKey ?? null,
    isUpdating: updateAmount.isPending || updateDescription.isPending,
  };
}
