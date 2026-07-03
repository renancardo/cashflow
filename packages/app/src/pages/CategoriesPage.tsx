import { useMemo, useState } from "react";
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

export function CategoriesPage() {
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);
  const { data, isPending, isError, error } = useCategories(selectedMonth);
  const { data: accountsData } = useAccounts();
  const { create, update, archive, upsertBudget, removeBudget } = useCategoryMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openCreate = () => {
    setEditorMode("create");
    setEditingId(null);
    setEditorValues({
      ...createEmptyCategoryInput(),
      color: "#6B7280",
      budgetEffectiveFromMonth: selectedMonth,
    });
    setEditorOpen(true);
  };

  const openEdit = (id: string) => {
    const category = data?.rawCategories.find((c) => c.id === id);
    if (!category) return;

    const row = (() => {
      const find = (rows: CategoryRowData[]): CategoryRowData | undefined => {
        for (const r of rows) {
          if (r.id === id) return r;
          const child = r.children.find((c) => c.id === id);
          if (child) return child;
        }
        return undefined;
      };
      return find(data?.rows ?? []);
    })();

    setEditorMode("edit");
    setEditingId(id);
    setEditorValues(toEditorValues(category, row?.budgetCents, selectedMonth));
    setEditorOpen(true);
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

    setEditorOpen(false);
  };

  const handleArchive = async () => {
    if (!editingId) return;
    await archive.mutateAsync(editingId);
    setEditorOpen(false);
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
          onClose={() => setEditorOpen(false)}
          onSave={handleSave}
          onArchive={editorMode === "edit" ? handleArchive : undefined}
        />
      }
    />
  );
}
