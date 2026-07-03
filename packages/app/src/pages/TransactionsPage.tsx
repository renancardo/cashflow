import { useMemo, useState } from "react";
import type { Transaction } from "@cashflow/core";
import {
  TransactionEditorPanel,
  TransactionsScreen,
  type TransactionEditorValues,
  type TransactionFiltersState,
} from "@cashflow/ui";
import {
  createEmptyTransactionInput,
  useTransactionMutations,
  type TransactionInput,
} from "../data/mutations/useTransactionMutations";
import { useTransactions } from "../data/queries/useTransactions";
import { useAccounts } from "../data/queries/useAccounts";

const PAGE_SIZE = 10;

function toEditorValues(tx: Transaction): TransactionEditorValues {
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

function toTransactionInput(values: TransactionEditorValues): TransactionInput {
  return {
    type: values.type,
    amountCents: values.amountCents,
    accountId: values.accountId,
    toAccountId: values.toAccountId,
    categoryId: values.categoryId,
    description: values.description,
    effectiveDate: values.effectiveDate,
  };
}

export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFiltersState>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data, isPending, isError, error } = useTransactions(filters);
  const { data: accountsData } = useAccounts();
  const { create, update, remove, reorder } = useTransactionMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorValues, setEditorValues] = useState<TransactionEditorValues>(() =>
    createEmptyTransactionInput(),
  );

  const visibleRows = useMemo(
    () => (data?.rows ?? []).slice(0, visibleCount),
    [data?.rows, visibleCount],
  );

  const hasMore = (data?.rows.length ?? 0) > visibleCount;

  const defaultAccountId = data?.accounts[0]?.id;

  const handleFiltersChange = (next: TransactionFiltersState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setEditorValues(createEmptyTransactionInput(defaultAccountId));
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    const tx = data?.rawTransactions.find((row) => row.id === id);
    if (!tx) return;
    setEditorMode("edit");
    setEditingId(id);
    setEditorValues(toEditorValues(tx));
    setEditorOpen(true);
  };

  const handleSave = async () => {
    const input = toTransactionInput(editorValues);
    if (!input.description.trim() || input.amountCents <= 0) return;

    if (editorMode === "create") {
      await create.mutateAsync(input);
    } else if (editingId) {
      await update.mutateAsync({ id: editingId, input });
    }

    setEditorOpen(false);
  };

  const handleDelete = async () => {
    if (!editingId) return;
    await remove.mutateAsync(editingId);
    setEditorOpen(false);
  };

  const handleReorder = async (
    draggedId: string,
    targetId: string,
    position: "before" | "after",
  ) => {
    await reorder.mutateAsync({ draggedId, targetId, position });
  };

  return (
    <TransactionsScreen
      transactions={visibleRows}
      totalCount={data?.totalCount ?? 0}
      hasMore={hasMore}
      accountOptions={data?.accounts ?? []}
      categoryOptions={data?.categories ?? []}
      filters={filters}
      workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
      status={isPending ? "loading" : isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      onFiltersChange={handleFiltersChange}
      onLoadMore={() => setVisibleCount((count) => count + PAGE_SIZE)}
      onAddTransaction={openCreate}
      onEdit={openEdit}
      onReorder={handleReorder}
      editor={
        <TransactionEditorPanel
          open={editorOpen}
          mode={editorMode}
          values={editorValues}
          accountOptions={data?.accounts ?? []}
          categoryOptions={data?.categories ?? []}
          onChange={(patch) => setEditorValues((current) => ({ ...current, ...patch }))}
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
          onDelete={editorMode === "edit" ? handleDelete : undefined}
        />
      }
    />
  );
}
