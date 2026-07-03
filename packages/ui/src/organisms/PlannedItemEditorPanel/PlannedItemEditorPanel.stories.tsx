import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlannedItemEditorPanel, type PlannedItemEditorValues } from "./PlannedItemEditorPanel.js";
import { DEMO_ACCOUNT_OPTIONS, DEMO_CATEGORY_OPTIONS } from "../../fixtures/transactions.js";

const meta: Meta<typeof PlannedItemEditorPanel> = {
  title: "Organisms/PlannedItemEditorPanel",
  component: PlannedItemEditorPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof PlannedItemEditorPanel>;

const editExpenseValues: PlannedItemEditorValues = {
  type: "expense",
  amountCents: 5_590,
  accountId: "cora-card",
  categoryId: "cat-entertainment",
  description: "Netflix",
  recurrence: "monthly",
  interval: 1,
  dayOfMonth: 15,
  startDate: "2024-01-15",
  isSubscription: true,
  isActive: true,
};

function EditExpenseStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState(editExpenseValues);

  return (
    <PlannedItemEditorPanel
      open={open}
      mode="edit"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={DEMO_CATEGORY_OPTIONS}
      occurrencePreview={[
        { occurrenceDate: "2026-07-15", effectiveDate: "2026-07-15", amountCents: 5_590 },
        { occurrenceDate: "2026-08-15", effectiveDate: "2026-08-15", amountCents: 5_590 },
        { occurrenceDate: "2026-09-15", effectiveDate: "2026-09-15", amountCents: 5_590 },
      ]}
      onMarkOccurrencePaid={() => undefined}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onDelete={() => setOpen(false)}
    />
  );
}

function CreateStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<PlannedItemEditorValues>({
    type: "expense",
    amountCents: 0,
    accountId: "",
    description: "",
    recurrence: "monthly",
    interval: 1,
    dayOfMonth: 1,
    startDate: "2026-07-01",
    isSubscription: false,
    isActive: true,
  });

  return (
    <PlannedItemEditorPanel
      open={open}
      mode="create"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={DEMO_CATEGORY_OPTIONS}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
    />
  );
}

function EditTransferStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<PlannedItemEditorValues>({
    type: "transfer",
    amountCents: 500_000,
    accountId: "cora-checking",
    toAccountId: "xp",
    description: "Investment — XP",
    recurrence: "once",
    interval: 1,
    startDate: "2026-08-15",
    isSubscription: false,
    isActive: true,
  });

  return (
    <PlannedItemEditorPanel
      open={open}
      mode="edit"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={DEMO_CATEGORY_OPTIONS}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onDelete={() => setOpen(false)}
    />
  );
}

function EditIncomeStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<PlannedItemEditorValues>({
    type: "income",
    amountCents: 850_000,
    accountId: "cora-checking",
    categoryId: "cat-salary",
    description: "Salary — Acme Corp",
    recurrence: "monthly",
    interval: 1,
    dayOfMonth: 5,
    startDate: "2024-01-05",
    isSubscription: false,
    isActive: true,
  });

  return (
    <PlannedItemEditorPanel
      open={open}
      mode="edit"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={DEMO_CATEGORY_OPTIONS}
      occurrencePreview={[
        { occurrenceDate: "2026-07-05", effectiveDate: "2026-07-05", amountCents: 850_000 },
        { occurrenceDate: "2026-08-05", effectiveDate: "2026-08-05", amountCents: 850_000 },
      ]}
      onMarkOccurrencePaid={() => undefined}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onDelete={() => setOpen(false)}
    />
  );
}

export const EditMonthlySubscription: Story = {
  render: () => <EditExpenseStory />,
};

export const CreateNew: Story = {
  render: () => <CreateStory />,
};

export const EditTransfer: Story = {
  render: () => <EditTransferStory />,
};

export const EditIncome: Story = {
  render: () => <EditIncomeStory />,
};
