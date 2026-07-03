import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  CategoryEditorPanel,
  type CategoryEditorValues,
} from "../CategoryEditorPanel/CategoryEditorPanel.js";
import { CategoriesScreen } from "./CategoriesScreen.js";
import {
  DEMO_CATEGORIES,
  DEMO_REMAINING_CENTS,
  DEMO_SELECTED_MONTH,
  DEMO_TOTAL_BUDGETED_CENTS,
  DEMO_TOTAL_SPENT_CENTS,
} from "../../fixtures/categories.js";
import { DEMO_WORKING_BALANCE_CENTS } from "../../fixtures/accounts.js";

const meta: Meta<typeof CategoriesScreen> = {
  title: "Pages/CategoriesScreen",
  component: CategoriesScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CategoriesScreen>;

const editorSeed: CategoryEditorValues = {
  name: "Groceries",
  kind: "expense",
  color: "#F59E0B",
  parentId: "cat-food",
  budgetCents: 100_000,
  budgetEffectiveFromMonth: DEMO_SELECTED_MONTH,
};

export const WithCategories: Story = {
  render: function Render() {
    const [selectedMonth, setSelectedMonth] = useState(DEMO_SELECTED_MONTH);

    return (
      <CategoriesScreen
        categories={DEMO_CATEGORIES}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        selectedMonth={selectedMonth}
        totalBudgetedCents={DEMO_TOTAL_BUDGETED_CENTS}
        totalSpentCents={DEMO_TOTAL_SPENT_CENTS}
        remainingCents={DEMO_REMAINING_CENTS}
        onAddCategory={() => undefined}
        onEditCategory={() => undefined}
        onMonthChange={setSelectedMonth}
      />
    );
  },
};

export const WithEditor: Story = {
  render: function Render() {
    const [selectedMonth, setSelectedMonth] = useState(DEMO_SELECTED_MONTH);
    const [editorOpen, setEditorOpen] = useState(true);
    const [editorMode, setEditorMode] = useState<"create" | "edit">("edit");
    const [editorValues, setEditorValues] = useState(editorSeed);

    return (
      <CategoriesScreen
        categories={DEMO_CATEGORIES}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        selectedMonth={selectedMonth}
        totalBudgetedCents={DEMO_TOTAL_BUDGETED_CENTS}
        totalSpentCents={DEMO_TOTAL_SPENT_CENTS}
        remainingCents={DEMO_REMAINING_CENTS}
        onAddCategory={() => {
          setEditorMode("create");
          setEditorValues({
            name: "",
            kind: "expense",
            color: "#6B7280",
            budgetEffectiveFromMonth: selectedMonth,
          });
          setEditorOpen(true);
        }}
        onEditCategory={() => {
          setEditorMode("edit");
          setEditorValues(editorSeed);
          setEditorOpen(true);
        }}
        onMonthChange={setSelectedMonth}
        editor={
          <CategoryEditorPanel
            open={editorOpen}
            mode={editorMode}
            values={editorValues}
            parentOptions={[
              { id: "cat-food", name: "Food" },
              { id: "cat-housing", name: "Housing" },
            ]}
            onChange={(patch) => setEditorValues((current) => ({ ...current, ...patch }))}
            onClose={() => setEditorOpen(false)}
            onSave={() => setEditorOpen(false)}
            onArchive={editorMode === "edit" ? () => setEditorOpen(false) : undefined}
          />
        }
      />
    );
  },
};

export const Empty: Story = {
  args: {
    categories: [],
    workingBalanceCents: DEMO_WORKING_BALANCE_CENTS,
    selectedMonth: DEMO_SELECTED_MONTH,
    totalBudgetedCents: 0,
    totalSpentCents: 0,
    remainingCents: 0,
  },
};

export const Loading: Story = {
  args: {
    categories: [],
    workingBalanceCents: 0,
    selectedMonth: DEMO_SELECTED_MONTH,
    totalBudgetedCents: 0,
    totalSpentCents: 0,
    remainingCents: 0,
    status: "loading",
  },
};

export const Error: Story = {
  args: {
    categories: [],
    workingBalanceCents: 0,
    selectedMonth: DEMO_SELECTED_MONTH,
    totalBudgetedCents: 0,
    totalSpentCents: 0,
    remainingCents: 0,
    status: "error",
    errorMessage: "Failed to read categories from storage.",
  },
};
