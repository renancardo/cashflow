import { useEffect, useMemo, useState } from "react";
import type { Category } from "@cashflow/core";
import {
  CategoriesScreen,
  CategoryEditorPanel,
  type CategoryEditorValues,
  type CategoryRowData,
} from "@cashflow/ui";
import {
  createEmptyCategoryInput,
  useCategoryMutations,
  type CategoryInput,
} from "../data/mutations/useCategoryMutations";
import { useCategories } from "../data/queries/useCategories";
import { useAccounts } from "../data/queries/useAccounts";

function todayMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function toEditorValues(
  category: Category,
  budgetCents?: number,
  budgetEffectiveFromMonth?: string,
): CategoryEditorValues {
  return {
    name: category.name,
    kind: category.kind,
    color: category.color ?? "#6B7280",
    parentId: category.parentId,
    budgetCents,
    budgetEffectiveFromMonth: budgetEffectiveFromMonth ?? todayMonth(),
  };
}

function toCategoryInput(values: CategoryEditorValues): CategoryInput {
  return {
    name: values.name,
    kind: values.kind,
    color: values.color || undefined,
    parentId: values.parentId || undefined,
  };
}

type EditorSearch = {
  new?: true;
  edit?: string;
};

type Props = {
  editorSearch?: EditorSearch;
  onEditorSearchChange?: (search: EditorSearch) => void;
};

function findCategoryRow(
  rows: CategoryRowData[],
  id: string,
): CategoryRowData | undefined {
  for (const row of rows) {
    if (row.id === id) return row;
    const child = row.children.find((entry) => entry.id === id);
    if (child) return child;
  }
  return undefined;
}

export function CategoriesPage({ editorSearch = {}, onEditorSearchChange }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const { data, isPending, isError, error } = useCategories(selectedMonth);
  const { data: accountsData } = useAccounts();
  const { create, update, archive, upsertBudget, removeBudget } = useCategoryMutations();

  const editorOpen = Boolean(editorSearch.new || editorSearch.edit);
  const editorMode = editorSearch.edit ? "edit" : "create";
  const editingId = editorSearch.edit ?? null;
  const [editorValues, setEditorValues] = useState<CategoryEditorValues>(() => ({
    ...createEmptyCategoryInput(),
    color: "#6B7280",
    budgetEffectiveFromMonth: todayMonth(),
  }));

  const parentOptions = useMemo(() => {
    if (!data) return [];
    return data.rawCategories
      .filter((c) => !c.parentId && c.kind === editorValues.kind)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [data, editorValues.kind]);

  useEffect(() => {
    if (editorSearch.edit) {
      const category = data?.rawCategories.find((entry) => entry.id === editorSearch.edit);
      if (!category) return;
      const row = findCategoryRow(data?.rows ?? [], editorSearch.edit);
      setEditorValues(toEditorValues(category, row?.budgetCents, selectedMonth));
      return;
    }

    if (editorSearch.new) {
      setEditorValues({
        ...createEmptyCategoryInput(),
        color: "#6B7280",
        budgetEffectiveFromMonth: selectedMonth,
      });
    }
  }, [editorSearch.edit, editorSearch.new, data?.rawCategories, data?.rows, selectedMonth]);

  const openCreate = () => {
    setEditorValues({
      ...createEmptyCategoryInput(),
      color: "#6B7280",
      budgetEffectiveFromMonth: selectedMonth,
    });
    onEditorSearchChange?.({ new: true });
  };

  const openEdit = (id: string) => {
    const category = data?.rawCategories.find((entry) => entry.id === id);
    if (!category) return;

    const row = findCategoryRow(data?.rows ?? [], id);
    setEditorValues(toEditorValues(category, row?.budgetCents, selectedMonth));
    onEditorSearchChange?.({ edit: id });
  };

  const closeEditor = () => {
    onEditorSearchChange?.({});
  };

  const handleSave = async () => {
    const input = toCategoryInput(editorValues);
    if (!input.name.trim()) return;

    let categoryId = editingId;

    if (editorMode === "create") {
      const created = await create.mutateAsync(input);
      categoryId = created.id;
    } else if (editingId) {
      await update.mutateAsync({ id: editingId, input });
    }

    // Upsert budget for expense categories
    if (categoryId && editorValues.kind === "expense") {
      if (editorValues.budgetCents !== undefined && editorValues.budgetCents > 0) {
        await upsertBudget.mutateAsync({
          categoryId,
          amountCents: editorValues.budgetCents,
          effectiveFromMonth: editorValues.budgetEffectiveFromMonth,
        });
      } else if (editorMode === "edit") {
        await removeBudget.mutateAsync(categoryId);
      }
    }

    closeEditor();
  };

  const handleArchive = async () => {
    if (!editingId) return;
    await archive.mutateAsync(editingId);
    closeEditor();
  };

  return (
    <CategoriesScreen
      categories={data?.rows ?? []}
      workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
      selectedMonth={selectedMonth}
      totalBudgetedCents={data?.totalBudgetedCents ?? 0}
      totalSpentCents={data?.totalSpentCents ?? 0}
      remainingCents={data?.remainingCents ?? 0}
      status={isPending ? "loading" : isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      onAddCategory={openCreate}
      onEditCategory={openEdit}
      onMonthChange={setSelectedMonth}
      editor={
        <CategoryEditorPanel
          open={editorOpen}
          mode={editorMode}
          values={editorValues}
          parentOptions={parentOptions}
          onChange={(patch) => setEditorValues((v) => ({ ...v, ...patch }))}
          onClose={closeEditor}
          onSave={handleSave}
          onArchive={editorMode === "edit" ? handleArchive : undefined}
        />
      }
    />
  );
}
