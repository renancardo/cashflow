import { useMutation, useQueryClient } from "@tanstack/react-query";
import { todayIso } from "@cashflow/core";
import { creditCardStatementsRepo, settleStatement } from "@cashflow/db";
import { queryKeys } from "../keys";

export type StatementEditorInput = {
  plannedPaymentCents?: number;
  payFromAccountId?: string;
};

export function useStatementMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
    queryClient.invalidateQueries({ queryKey: ["creditCardStatements"] });
    queryClient.invalidateQueries({ queryKey: ["statementDetail"] });
  };

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: StatementEditorInput }) =>
      creditCardStatementsRepo.update(id, {
        plannedPaymentCents: input.plannedPaymentCents,
        payFromAccountId: input.payFromAccountId,
      }),
    onSuccess: invalidate,
  });

  const resetOverride = useMutation({
    mutationFn: (id: string) =>
      creditCardStatementsRepo.update(id, { plannedPaymentCents: undefined }),
    onSuccess: invalidate,
  });

  const markPaid = useMutation({
    mutationFn: ({ id, effectiveDate }: { id: string; effectiveDate?: string }) =>
      settleStatement(id, effectiveDate ?? todayIso()),
    onSuccess: invalidate,
  });

  const recordPayment = useMutation({
    mutationFn: async ({
      id,
      input,
      effectiveDate,
    }: {
      id: string;
      input: StatementEditorInput;
      effectiveDate?: string;
    }) => {
      await creditCardStatementsRepo.update(id, {
        plannedPaymentCents: input.plannedPaymentCents,
        payFromAccountId: input.payFromAccountId,
      });
      return settleStatement(id, effectiveDate ?? todayIso());
    },
    onSuccess: invalidate,
  });

  return { update, resetOverride, markPaid, recordPayment };
}
