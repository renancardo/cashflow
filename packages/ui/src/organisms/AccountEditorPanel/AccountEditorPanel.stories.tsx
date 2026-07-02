import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountEditorPanel, type AccountEditorValues } from "./AccountEditorPanel.js";

const meta: Meta<typeof AccountEditorPanel> = {
  title: "Organisms/AccountEditorPanel",
  component: AccountEditorPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AccountEditorPanel>;

const initialValues: AccountEditorValues = {
  name: "Cartão Cora",
  type: "credit_card",
  currency: "BRL",
  isWorking: false,
  anchorBalanceCents: 185_000,
  anchorDate: "2026-06-01",
  closingDay: 25,
  dueDay: 3,
  creditLimitCents: 800_000,
  defaultPayFromAccountId: "cora-checking",
  institution: "Cora",
};

function EditorStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState(initialValues);

  return (
    <AccountEditorPanel
      open={open}
      mode="edit"
      values={values}
      payFromOptions={[
        { id: "cora-checking", name: "Cora Checking" },
        { id: "wallet", name: "Carteira" },
      ]}
      onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onArchive={() => setOpen(false)}
    />
  );
}

export const CreditCardEdit: Story = {
  render: () => <EditorStory />,
};
