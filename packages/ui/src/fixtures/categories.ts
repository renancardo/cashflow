import type { CategoryRowData } from "../organisms/CategoriesScreen/CategoriesScreen.js";

export const DEMO_SELECTED_MONTH = "2026-06";

export const DEMO_CATEGORIES: CategoryRowData[] = [
  {
    id: "cat-food",
    name: "Food",
    kind: "expense",
    color: "#D97706",
    budgetCents: 150_000,
    actualCents: 147_000,
    children: [
      {
        id: "cat-groceries",
        name: "Groceries",
        kind: "expense",
        color: "#F59E0B",
        parentId: "cat-food",
        budgetCents: 100_000,
        actualCents: 85_000,
        children: [],
      },
      {
        id: "cat-restaurants",
        name: "Restaurants",
        kind: "expense",
        color: "#EF4444",
        parentId: "cat-food",
        budgetCents: 50_000,
        actualCents: 62_000,
        children: [],
      },
    ],
  },
  {
    id: "cat-housing",
    name: "Housing",
    kind: "expense",
    color: "#6366F1",
    budgetCents: 250_000,
    actualCents: 250_000,
    children: [],
  },
  {
    id: "cat-transport",
    name: "Transport",
    kind: "expense",
    color: "#10B981",
    budgetCents: 40_000,
    actualCents: 28_500,
    children: [],
  },
  {
    id: "cat-entertainment",
    name: "Entertainment",
    kind: "expense",
    color: "#EC4899",
    budgetCents: 30_000,
    actualCents: 35_200,
    children: [],
  },
  {
    id: "cat-utilities",
    name: "Utilities",
    kind: "expense",
    color: "#3B82F6",
    budgetCents: 35_000,
    actualCents: 31_000,
    children: [],
  },
  {
    id: "cat-debt",
    name: "Debt",
    kind: "expense",
    color: "#6B7280",
    actualCents: 15_000,
    children: [],
  },
  {
    id: "cat-salary",
    name: "Salary",
    kind: "income",
    color: "#22C55E",
    actualCents: 8_500_000,
    children: [],
  },
  {
    id: "cat-freelance",
    name: "Freelance",
    kind: "income",
    color: "#84CC16",
    actualCents: 1_200_000,
    children: [],
  },
];

export const DEMO_TOTAL_BUDGETED_CENTS = 505_000;
export const DEMO_TOTAL_SPENT_CENTS = 506_700;
export const DEMO_REMAINING_CENTS = DEMO_TOTAL_BUDGETED_CENTS - DEMO_TOTAL_SPENT_CENTS;
