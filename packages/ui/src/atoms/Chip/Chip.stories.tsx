import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip } from "./Chip.js";

const meta: Meta<typeof Chip> = {
  title: "Atoms/Chip",
  component: Chip,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "income",
        "expense",
        "planned",
        "actual",
        "card",
        "installment",
        "subscription",
        "statement",
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    children: "Transfer",
  },
};

export const Income: Story = {
  args: {
    variant: "income",
    children: "Income",
  },
};

export const Planned: Story = {
  args: {
    variant: "planned",
    children: "Planned",
  },
};

export const Installment: Story = {
  args: {
    variant: "installment",
    children: "Installment",
  },
};
