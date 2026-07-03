import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  InstallmentPlanEditorPanel,
  type InstallmentPlanEditorValues,
} from "./InstallmentPlanEditorPanel.js";
import { DEMO_ACCOUNT_OPTIONS, DEMO_CATEGORY_OPTIONS } from "../../fixtures/transactions.js";

const meta: Meta<typeof InstallmentPlanEditorPanel> = {
  title: "Organisms/InstallmentPlanEditorPanel",
  component: InstallmentPlanEditorPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof InstallmentPlanEditorPanel>;

const categoryOptions = DEMO_CATEGORY_OPTIONS.map((c) => ({ id: c.id, name: c.name }));

const editValues: InstallmentPlanEditorValues = {
  description: "Ipanema",
  accountId: "cora-checking",
  categoryId: "cat-debt",
  installmentAmountCents: 47_500,
  installmentCount: 36,
  firstDueDate: "2024-07-10",
  dayOfMonth: 10,
  isActive: true,
};

function EditStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState(editValues);

  return (
    <InstallmentPlanEditorPanel
      open={open}
      mode="edit"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={categoryOptions}
      schedulePreview={[
        { index: 11, dueDate: "2026-06-10", amountCents: 47_500, status: "paid" },
        { index: 12, dueDate: "2026-07-10", amountCents: 47_500, status: "paid" },
        { index: 13, dueDate: "2026-08-10", amountCents: 47_500, status: "scheduled" },
        { index: 14, dueDate: "2026-09-10", amountCents: 47_500, status: "scheduled" },
        { index: 15, dueDate: "2026-10-10", amountCents: 47_500, status: "scheduled" },
        { index: 16, dueDate: "2026-11-10", amountCents: 47_500, status: "scheduled" },
        { index: 17, dueDate: "2026-12-10", amountCents: 47_500, status: "scheduled" },
        { index: 18, dueDate: "2027-01-10", amountCents: 47_500, status: "scheduled" },
        { index: 19, dueDate: "2027-02-10", amountCents: 47_500, status: "scheduled" },
      ]}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onDelete={() => setOpen(false)}
    />
  );
}

function CreateStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<InstallmentPlanEditorValues>({
    description: "",
    accountId: "",
    installmentAmountCents: 0,
    installmentCount: 12,
    firstDueDate: "2026-07-10",
    dayOfMonth: 10,
    isActive: true,
  });

  return (
    <InstallmentPlanEditorPanel
      open={open}
      mode="create"
      values={values}
      accountOptions={DEMO_ACCOUNT_OPTIONS}
      categoryOptions={categoryOptions}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
    />
  );
}

export const EditExisting: Story = {
  render: () => <EditStory />,
};

export const CreateNew: Story = {
  render: () => <CreateStory />,
};
