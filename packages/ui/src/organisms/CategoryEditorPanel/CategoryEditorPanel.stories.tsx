import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { CategoryEditorPanel, type CategoryEditorValues } from "./CategoryEditorPanel.js";

const meta: Meta<typeof CategoryEditorPanel> = {
  title: "Organisms/CategoryEditorPanel",
  component: CategoryEditorPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof CategoryEditorPanel>;

const defaultValues: CategoryEditorValues = {
  name: "Food",
  kind: "expense",
  color: "#D97706",
  budgetCents: 150_000,
  budgetEffectiveFromMonth: "2026-06",
};

function EditStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState(defaultValues);

  return (
    <CategoryEditorPanel
      open={open}
      mode="edit"
      values={values}
      parentOptions={[
        { id: "cat-food", name: "Food" },
        { id: "cat-housing", name: "Housing" },
      ]}
      onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
      onArchive={() => setOpen(false)}
    />
  );
}

function CreateStory() {
  const [open, setOpen] = useState(true);
  const [values, setValues] = useState<CategoryEditorValues>({
    name: "",
    kind: "expense",
    color: "#6B7280",
    budgetEffectiveFromMonth: "2026-07",
  });

  return (
    <CategoryEditorPanel
      open={open}
      mode="create"
      values={values}
      parentOptions={[
        { id: "cat-food", name: "Food" },
        { id: "cat-housing", name: "Housing" },
      ]}
      onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
      onClose={() => setOpen(false)}
      onSave={() => setOpen(false)}
    />
  );
}

export const EditExpense: Story = {
  render: () => <EditStory />,
};

export const CreateNew: Story = {
  render: () => <CreateStory />,
};
