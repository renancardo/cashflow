import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  PlannedItemEditorPanel,
  type PlannedItemEditorValues,
} from "../PlannedItemEditorPanel/PlannedItemEditorPanel.js";
import { ForecastScreen, type ForecastFilter } from "./ForecastScreen.js";
import {
  DEMO_FORECAST_SUMMARY,
  DEMO_INSTALLMENT_ROWS,
  DEMO_PLANNED_ROWS,
  DEMO_STATEMENT_ROWS,
  DEMO_WORKING_BALANCE_CENTS,
} from "../../fixtures/forecast.js";
import { DEMO_ACCOUNT_OPTIONS, DEMO_CATEGORY_OPTIONS } from "../../fixtures/transactions.js";

const meta: Meta<typeof ForecastScreen> = {
  title: "Pages/ForecastScreen",
  component: ForecastScreen,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ForecastScreen>;

export const Populated: Story = {
  render: function Render() {
    const [filter, setFilter] = useState<ForecastFilter>("all");
    return (
      <ForecastScreen
        plannedRows={DEMO_PLANNED_ROWS}
        installmentRows={DEMO_INSTALLMENT_ROWS}
        statementRows={DEMO_STATEMENT_ROWS}
        allPlannedRows={DEMO_PLANNED_ROWS}
        allInstallmentRows={DEMO_INSTALLMENT_ROWS}
        allStatementRows={DEMO_STATEMENT_ROWS}
        summary={DEMO_FORECAST_SUMMARY}
        filter={filter}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        onFilterChange={setFilter}
        onAddForecastItem={() => undefined}
        onAddInstallmentPlan={() => undefined}
      />
    );
  },
};

export const Empty: Story = {
  args: {
    plannedRows: [],
    installmentRows: [],
    statementRows: [],
    allPlannedRows: [],
    allInstallmentRows: [],
    allStatementRows: [],
    summary: {
      activeItemCount: 0,
      subscriptionCount: 0,
      nextOutflow: null,
      nextInflow: null,
    },
    filter: "all",
    workingBalanceCents: DEMO_WORKING_BALANCE_CENTS,
    onAddForecastItem: () => undefined,
    onAddInstallmentPlan: () => undefined,
  },
};

export const WithPlannedEditor: Story = {
  render: function Render() {
    const [editorOpen, setEditorOpen] = useState(true);
    const [values, setValues] = useState<PlannedItemEditorValues>({
      type: "expense" as const,
      amountCents: 5_590,
      accountId: "cora-card",
      categoryId: "cat-entertainment",
      description: "Netflix",
      recurrence: "monthly" as const,
      interval: 1,
      dayOfMonth: 15,
      startDate: "2024-01-15",
      isSubscription: true,
      isActive: true,
    });

    return (
      <ForecastScreen
        plannedRows={DEMO_PLANNED_ROWS}
        installmentRows={DEMO_INSTALLMENT_ROWS}
        statementRows={DEMO_STATEMENT_ROWS}
        allPlannedRows={DEMO_PLANNED_ROWS}
        allInstallmentRows={DEMO_INSTALLMENT_ROWS}
        allStatementRows={DEMO_STATEMENT_ROWS}
        summary={DEMO_FORECAST_SUMMARY}
        filter="all"
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        onAddForecastItem={() => setEditorOpen(true)}
        onAddInstallmentPlan={() => undefined}
        editor={
          <PlannedItemEditorPanel
            open={editorOpen}
            mode="edit"
            values={values}
            accountOptions={DEMO_ACCOUNT_OPTIONS}
            categoryOptions={DEMO_CATEGORY_OPTIONS}
            occurrencePreview={[
              { occurrenceDate: "2026-07-15", effectiveDate: "2026-07-15", amountCents: 5_590 },
              { occurrenceDate: "2026-08-15", effectiveDate: "2026-08-15", amountCents: 5_590 },
            ]}
            onMarkOccurrencePaid={() => undefined}
            onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
            onClose={() => setEditorOpen(false)}
            onSave={() => setEditorOpen(false)}
            onDelete={() => setEditorOpen(false)}
          />
        }
      />
    );
  },
};
