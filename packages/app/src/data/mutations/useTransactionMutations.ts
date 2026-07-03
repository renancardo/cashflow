import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction, TxType } from "@cashflow/core";
import { transactionsRepo, type ReorderPosition } from "@cashflow/db";
import { queryKeys } from "../keys";

export type TransactionInput = {
  type: TxType;
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  effectiveDate: string;
};

export type ReorderTransactionInput = {
  draggedId: string;
  targetId: string;
  position: ReorderPosition;
};

function toTransactionPayload(input: TransactionInput): Omit<Transaction, "id" | "sortOrder"> {
  const isTransfer = input.type === "transfer";

  return {
    type: input.type,
    amountCents: Math.abs(input.amountCents),
    accountId: input.accountId,
    toAccountId: isTransfer ? input.toAccountId : undefined,
    categoryId: isTransfer ? undefined : input.categoryId,
    description: input.description.trim(),
    effectiveDate: input.effectiveDate,
  };
}

export function useTransactionMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.installmentPlans });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
  };

  const create = useMutation({
    mutationFn: (input: TransactionInput) => transactionsRepo.create(toTransactionPayload(input)),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TransactionInput }) =>
      transactionsRepo.update(id, toTransactionPayload(input)),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => transactionsRepo.delete(id),
    onSuccess: invalidate,
  });

  const reorder = useMutation({
    mutationFn: (input: ReorderTransactionInput) =>
      transactionsRepo.reorderWithinDate(input.draggedId, input.targetId, input.position),
    onSuccess: invalidate,
  });

  return { create, update, remove, reorder };
}

export function createEmptyTransactionInput(
  defaultAccountId?: string,
  currency = "BRL",
): TransactionInput {
  void currency;
  return {
    type: "expense",
    amountCents: 0,
    accountId: defaultAccountId ?? "",
    description: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
  };
}
