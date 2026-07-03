import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Category, CategoryKind } from "@cashflow/core";
import { categoriesRepo, categoryBudgetsRepo } from "@cashflow/db";

export type CategoryInput = {
  name: string;
  kind: CategoryKind;
  color?: string;
  parentId?: string;
};

export type CategoryBudgetInput = {
  categoryId: string;
  amountCents: number;
  effectiveFromMonth: string;
};

function toCategoryPayload(input: CategoryInput): Omit<Category, "id"> {
  return {
    name: input.name.trim(),
    kind: input.kind,
    color: input.color || undefined,
    parentId: input.parentId || undefined,
  };
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  };

  const create = useMutation({
    mutationFn: (input: CategoryInput) => categoriesRepo.create(toCategoryPayload(input)),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) =>
      categoriesRepo.update(id, toCategoryPayload(input)),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => categoriesRepo.archive(id),
    onSuccess: invalidate,
  });

  const upsertBudget = useMutation({
    mutationFn: (input: CategoryBudgetInput) =>
      categoryBudgetsRepo.upsertForMonth(input.categoryId, input.effectiveFromMonth, input.amountCents),
    onSuccess: invalidate,
  });

  const removeBudget = useMutation({
    mutationFn: async (categoryId: string) => {
      const budgets = await categoryBudgetsRepo.getByCategoryId(categoryId);
      await Promise.all(budgets.map((b) => categoryBudgetsRepo.archive(b.id)));
    },
    onSuccess: invalidate,
  });

  return { create, update, archive, upsertBudget, removeBudget };
}

export function createEmptyCategoryInput(): CategoryInput {
  return { name: "", kind: "expense" };
}
