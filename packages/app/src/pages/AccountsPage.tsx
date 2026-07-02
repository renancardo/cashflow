import { useMemo, useState } from "react";
import type { Account } from "@cashflow/core";
import { defaultIsWorking } from "@cashflow/core";
import { AccountEditorPanel, AccountsScreen, type AccountEditorValues } from "@cashflow/ui";
import {
  createEmptyAccountInput,
  useAccountMutations,
  type AccountInput,
} from "../data/mutations/useAccountMutations";
import { useAccounts } from "../data/queries/useAccounts";

function toEditorValues(account: Account): AccountEditorValues {
  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    isWorking: account.isWorking,
    anchorBalanceCents: account.anchorBalanceCents,
    anchorDate: account.anchorDate,
    closingDay: account.closingDay,
    dueDay: account.dueDay,
    creditLimitCents: account.creditLimitCents,
    defaultPayFromAccountId: account.defaultPayFromAccountId,
    institution: account.institution,
    notes: account.notes,
  };
}

function toAccountInput(values: AccountEditorValues): AccountInput {
  return {
    name: values.name,
    type: values.type,
    currency: values.currency,
    isWorking: values.isWorking,
    anchorBalanceCents: values.anchorBalanceCents,
    anchorDate: values.anchorDate,
    closingDay: values.closingDay,
    dueDay: values.dueDay,
    creditLimitCents: values.creditLimitCents,
    defaultPayFromAccountId: values.defaultPayFromAccountId,
    institution: values.institution,
    notes: values.notes,
  };
}

export function AccountsPage() {
  const { data, isPending, isError, error } = useAccounts();
  const { create, update, setWorking, archive } = useAccountMutations();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<AccountEditorValues>(createEmptyAccountInput());

  const payFromOptions = useMemo(
    () =>
      (data?.rawAccounts ?? [])
        .filter((account) => account.isWorking && account.type !== "credit_card")
        .map((account) => ({ id: account.id, name: account.name })),
    [data?.rawAccounts],
  );

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setEditorValues(createEmptyAccountInput());
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    const account = data?.rawAccounts.find((row) => row.id === id);
    if (!account) return;
    setEditorMode("edit");
    setEditingId(id);
    setEditorValues(toEditorValues(account));
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const input = toAccountInput(editorValues);
    if (!input.name.trim()) return;

    if (editorMode === "create") {
      await create.mutateAsync(input);
    } else if (editingId) {
      await update.mutateAsync({ id: editingId, input });
    }

    setEditorOpen(false);
  };

  const handleArchive = async () => {
    if (!editingId) return;
    await archive.mutateAsync(editingId);
    setEditorOpen(false);
  };

  const handleTypeChange = (patch: Partial<AccountEditorValues>) => {
    setEditorValues((current) => {
      const next = { ...current, ...patch };
      if (patch.type && patch.type !== current.type) {
        next.isWorking = defaultIsWorking(patch.type);
      }
      return next;
    });
  };

  return (
    <AccountsScreen
      accounts={data?.accounts ?? []}
      workingBalanceCents={data?.workingBalanceCents ?? 0}
      status={isPending ? "loading" : isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      onAddAccount={openCreate}
      onEdit={openEdit}
      onWorkingChange={(id, isWorking) => setWorking.mutate({ id, isWorking })}
      editor={
        <AccountEditorPanel
          open={editorOpen}
          mode={editorMode}
          values={editorValues}
          payFromOptions={payFromOptions}
          onChange={handleTypeChange}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
          onArchive={editorMode === "edit" ? handleArchive : undefined}
        />
      }
    />
  );
}
