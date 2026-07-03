import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  TransactionEditorPanel,
  type TransactionEditorValues,
} from "../TransactionEditorPanel/TransactionEditorPanel.js";
import { TransactionsScreen } from "./TransactionsScreen.js";
import { DEMO_WORKING_BALANCE_CENTS } from "../../fixtures/accounts.js";
import {
  DEMO_ACCOUNT_OPTIONS,
  DEMO_CATEGORY_OPTIONS,
  DEMO_TRANSACTIONS,
} from "../../fixtures/transactions.js";

const meta: Meta<typeof TransactionsScreen> = {
  title: "Pages/TransactionsScreen",
  component: TransactionsScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TransactionsScreen>;

export const WithTransactions: Story = {
  render: function Render() {
    const [filters, setFilters] = useState({});
    const [visibleCount, setVisibleCount] = useState(5);

    return (
      <TransactionsScreen
        transactions={DEMO_TRANSACTIONS.slice(0, visibleCount)}
        totalCount={DEMO_TRANSACTIONS.length}
        hasMore={visibleCount < DEMO_TRANSACTIONS.length}
        accountOptions={DEMO_ACCOUNT_OPTIONS}
        categoryOptions={DEMO_CATEGORY_OPTIONS}
        filters={filters}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        onFiltersChange={setFilters}
        onLoadMore={() => setVisibleCount((count) => count + 5)}
        onAddTransaction={() => undefined}
        onEdit={() => undefined}
      />
    );
  },
};

export const WithEditor: Story = {
  render: function Render() {
    const [filters, setFilters] = useState({});
    const [editorOpen, setEditorOpen] = useState(true);
    const [editorValues, setEditorValues] = useState<TransactionEditorValues>({
      type: "expense" as const,
      amountCents: 28_740,
      accountId: "cora-checking",
      categoryId: "cat-groceries",
      description: "Supermercado Extra",
      effectiveDate: "2026-06-28",
    });

    return (
      <TransactionsScreen
        transactions={DEMO_TRANSACTIONS}
        totalCount={DEMO_TRANSACTIONS.length}
        hasMore={false}
        accountOptions={DEMO_ACCOUNT_OPTIONS}
        categoryOptions={DEMO_CATEGORY_OPTIONS}
        filters={filters}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        onFiltersChange={setFilters}
        onAddTransaction={() => setEditorOpen(true)}
        onEdit={() => setEditorOpen(true)}
        editor={
          <TransactionEditorPanel
            open={editorOpen}
            mode="edit"
            values={editorValues}
            accountOptions={DEMO_ACCOUNT_OPTIONS}
            categoryOptions={DEMO_CATEGORY_OPTIONS}
            onChange={(patch) => setEditorValues((current) => ({ ...current, ...patch }))}
            onClose={() => setEditorOpen(false)}
            onSave={() => setEditorOpen(false)}
            onDelete={() => setEditorOpen(false)}
          />
        }
      />
    );
  },
};

export const Empty: Story = {
  args: {
    transactions: [],
    totalCount: 0,
    hasMore: false,
    accountOptions: DEMO_ACCOUNT_OPTIONS,
    categoryOptions: DEMO_CATEGORY_OPTIONS,
    filters: {},
    workingBalanceCents: DEMO_WORKING_BALANCE_CENTS,
  },
};
