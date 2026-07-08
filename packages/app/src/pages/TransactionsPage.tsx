import { useEffect, useMemo, useState } from "react";
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
import { useAppClock } from "../dev/useAppClock";

const PAGE_SIZE = 10;

type EditorSearch = {
  new?: true;
  edit?: string;
};

type Props = {
  editorSearch?: EditorSearch;
  onEditorSearchChange?: (search: EditorSearch) => void;
};

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

export function TransactionsPage({ editorSearch = {}, onEditorSearchChange }: Props) {
  const { today } = useAppClock();
  const [filters, setFilters] = useState<TransactionFiltersState>({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { data, isPending, isError, error } = useTransactions(filters);
  const { data: accountsData } = useAccounts();
  const { create, update, remove, reorder } = useTransactionMutations();

  const editorOpen = Boolean(editorSearch.new || editorSearch.edit);
  const editorMode = editorSearch.edit ? "edit" : "create";
  const editingId = editorSearch.edit ?? null;
  const [editorValues, setEditorValues] = useState<TransactionEditorValues>(() =>
    createEmptyTransactionInput(today),
  );

  const visibleRows = useMemo(
    () => (data?.rows ?? []).slice(0, visibleCount),
    [data?.rows, visibleCount],
  );

  const hasMore = (data?.rows.length ?? 0) > visibleCount;

  const defaultAccountId = data?.accounts[0]?.id;

  useEffect(() => {
    if (editorSearch.edit) {
      const tx = data?.rawTransactions.find((row) => row.id === editorSearch.edit);
      if (tx) setEditorValues(toEditorValues(tx));
      return;
    }

    if (editorSearch.new) {
      setEditorValues(createEmptyTransactionInput(today, defaultAccountId));
    }
  }, [editorSearch.edit, editorSearch.new, data?.rawTransactions, defaultAccountId]);

  const handleFiltersChange = (next: TransactionFiltersState) => {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  };

  const openCreate = () => {
    setEditorValues(createEmptyTransactionInput(today, defaultAccountId));
    onEditorSearchChange?.({ new: true });
  };

  const openEdit = (id: string) => {
    const tx = data?.rawTransactions.find((row) => row.id === id);
    if (!tx) return;
    setEditorValues(toEditorValues(tx));
    onEditorSearchChange?.({ edit: id });
  };

  const closeEditor = () => {
    onEditorSearchChange?.({});
  };

  const editingTx = editingId
    ? data?.rawTransactions.find((row) => row.id === editingId)
    : undefined;

  const handleSave = async () => {
    const input = toTransactionInput(editorValues);
    if (!input.description.trim() || input.amountCents <= 0) return;

    if (editorMode === "create") {
      await create.mutateAsync(input);
    } else if (editingId) {
      await update.mutateAsync({ id: editingId, input });
    }

    closeEditor();
  };

  const handleDelete = async () => {
    if (!editingId) return;
    await remove.mutateAsync(editingId);
    closeEditor();
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
          allowCreditCardDestination={Boolean(editingTx?.paysStatementId)}
          onChange={(patch) => setEditorValues((current) => ({ ...current, ...patch }))}
          onClose={closeEditor}
          onSave={handleSave}
          onDelete={editorMode === "edit" ? handleDelete : undefined}
        />
      }
    />
  );
}
