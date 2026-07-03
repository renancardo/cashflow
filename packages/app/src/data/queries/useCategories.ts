import { useQuery } from "@tanstack/react-query";
import type { CategoryKind } from "@cashflow/core";
import { categoriesRepo, categoryBudgetsRepo, transactionsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";

export type CategoryRowData = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string;
  parentId?: string;
  budgetCents?: number;
  actualCents: number;
  children: CategoryRowData[];
};

function buildRows(
  categories: Awaited<ReturnType<typeof categoriesRepo.getAll>>,
  budgets: Awaited<ReturnType<typeof categoryBudgetsRepo.getAll>>,
  actuals: Map<string, number>,
  selectedMonth: string,
): CategoryRowData[] {
  function getApplicableBudgetCents(categoryId: string): number | undefined {
    const applicable = budgets
      .filter((b) => b.categoryId === categoryId && b.effectiveFromMonth <= selectedMonth)
      .sort((a, b) => b.effectiveFromMonth.localeCompare(a.effectiveFromMonth));
    return applicable[0]?.amountCents;
  }

  const roots = categories.filter((c) => !c.parentId);
  const children = categories.filter((c) => c.parentId);

  return roots.map((root) => {
    const rootBudget = getApplicableBudgetCents(root.id);
    const rootActual = actuals.get(root.id) ?? 0;

    const childRows: CategoryRowData[] = children
      .filter((c) => c.parentId === root.id)
      .map((child) => ({
        id: child.id,
        name: child.name,
        kind: child.kind,
        color: child.color,
        parentId: child.parentId,
        budgetCents: getApplicableBudgetCents(child.id),
        actualCents: actuals.get(child.id) ?? 0,
        children: [],
      }));

    const totalActual =
      root.kind === "expense"
        ? rootActual + childRows.reduce((sum, c) => sum + c.actualCents, 0)
        : rootActual;

    const totalBudget =
      root.kind === "expense" && childRows.length > 0
        ? childRows.reduce((sum, c) => sum + (c.budgetCents ?? 0), rootBudget ?? 0)
        : rootBudget;

    return {
      id: root.id,
      name: root.name,
      kind: root.kind,
      color: root.color,
      parentId: undefined,
      budgetCents: totalBudget,
      actualCents: totalActual,
      children: childRows,
    };
  });
}

export function useCategories(selectedMonth: string) {
  return useQuery({
    queryKey: queryKeys.categories(selectedMonth),
    queryFn: async () => {
      const [categories, budgets, transactions] = await Promise.all([
        categoriesRepo.getAll(),
        categoryBudgetsRepo.getAll(),
        transactionsRepo.getAll(),
      ]);

      const [year, month] = selectedMonth.split("-").map(Number);
      const lastDay = new Date(year, month, 0).getDate();
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

      const actuals = new Map<string, number>();
      for (const tx of transactions) {
        if (
          tx.type === "expense" &&
          tx.categoryId &&
          tx.effectiveDate >= monthStart &&
          tx.effectiveDate <= monthEnd
        ) {
          actuals.set(tx.categoryId, (actuals.get(tx.categoryId) ?? 0) + tx.amountCents);
        }
      }

      const rows = buildRows(categories, budgets, actuals, selectedMonth);
      const expenseRows = rows.filter((r) => r.kind === "expense");
      const totalBudgetedCents = expenseRows.reduce((sum, r) => sum + (r.budgetCents ?? 0), 0);
      const totalSpentCents = expenseRows.reduce((sum, r) => sum + r.actualCents, 0);

      return {
        rows,
        rawCategories: categories,
        totalBudgetedCents,
        totalSpentCents,
        remainingCents: totalBudgetedCents - totalSpentCents,
      };
    },
  });
}
