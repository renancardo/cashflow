import type { Category, CategoryBudget } from "@cashflow/core";

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-food", name: "Food", kind: "expense", color: "#D97706" },
  { id: "cat-groceries", name: "Groceries", kind: "expense", color: "#F59E0B", parentId: "cat-food" },
  { id: "cat-restaurants", name: "Restaurants", kind: "expense", color: "#EF4444", parentId: "cat-food" },
  { id: "cat-housing", name: "Housing", kind: "expense", color: "#6366F1" },
  { id: "cat-transport", name: "Transport", kind: "expense", color: "#10B981" },
  { id: "cat-entertainment", name: "Entertainment", kind: "expense", color: "#EC4899" },
  { id: "cat-utilities", name: "Utilities", kind: "expense", color: "#3B82F6" },
  { id: "cat-debt", name: "Debt", kind: "expense", color: "#6B7280" },
  { id: "cat-salary", name: "Salary", kind: "income", color: "#22C55E" },
  { id: "cat-freelance", name: "Freelance", kind: "income", color: "#84CC16" },
];

export const SEED_CATEGORY_BUDGETS: CategoryBudget[] = [
  { id: "bgt-food", categoryId: "cat-food", amountCents: 0, effectiveFromMonth: "2026-01" },
  { id: "bgt-groceries", categoryId: "cat-groceries", amountCents: 100_000, effectiveFromMonth: "2026-01" },
  { id: "bgt-restaurants", categoryId: "cat-restaurants", amountCents: 50_000, effectiveFromMonth: "2026-01" },
  { id: "bgt-housing", categoryId: "cat-housing", amountCents: 250_000, effectiveFromMonth: "2026-01" },
  { id: "bgt-transport", categoryId: "cat-transport", amountCents: 40_000, effectiveFromMonth: "2026-01" },
  { id: "bgt-entertainment", categoryId: "cat-entertainment", amountCents: 30_000, effectiveFromMonth: "2026-01" },
  { id: "bgt-utilities", categoryId: "cat-utilities", amountCents: 35_000, effectiveFromMonth: "2026-01" },
];
