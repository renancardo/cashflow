import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Account, AccountType, Settings } from "@cashflow/core";
import { defaultIsWorking } from "@cashflow/core";
import { accountsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";

export type AccountInput = {
  name: string;
  type: AccountType;
  currency: string;
  isWorking: boolean;
  anchorBalanceCents: number;
  anchorDate: string;
  closingDay?: number;
  dueDay?: number;
  creditLimitCents?: number;
  defaultPayFromAccountId?: string;
  institution?: string;
  notes?: string;
};

function toAccountPayload(input: AccountInput): Omit<Account, "id"> {
  return {
    name: input.name.trim(),
    type: input.type,
    currency: input.currency,
    isWorking:
      input.type === "credit_card" || input.type === "investment" ? false : input.isWorking,
    anchorBalanceCents: input.anchorBalanceCents,
    anchorDate: input.anchorDate,
    closingDay: input.type === "credit_card" ? input.closingDay : undefined,
    dueDay: input.type === "credit_card" ? input.dueDay : undefined,
    creditLimitCents: input.type === "credit_card" ? input.creditLimitCents : undefined,
    defaultPayFromAccountId:
      input.type === "credit_card" ? input.defaultPayFromAccountId : undefined,
    institution: input.institution,
    notes: input.notes,
  };
}

export function useAccountMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
    queryClient.invalidateQueries({ queryKey: ["projection"] });
    queryClient.invalidateQueries({ queryKey: ["creditCardStatements"] });
  };

  const create = useMutation({
    mutationFn: (input: AccountInput) => accountsRepo.create(toAccountPayload(input)),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountInput }) =>
      accountsRepo.update(id, toAccountPayload(input)),
    onSuccess: invalidate,
  });

  const setWorking = useMutation({
    mutationFn: ({ id, isWorking }: { id: string; isWorking: boolean }) =>
      accountsRepo.update(id, { isWorking }),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => accountsRepo.archive(id),
    onSuccess: invalidate,
  });

  return { create, update, setWorking, archive };
}

export function createEmptyAccountInput(
  currency = "BRL",
  settings?: Pick<Settings, "defaultWorkingForType">,
): AccountInput {
  return {
    name: "",
    type: "checking",
    currency,
    isWorking: defaultIsWorking("checking", settings),
    anchorBalanceCents: 0,
    anchorDate: new Date().toISOString().slice(0, 10),
  };
}
