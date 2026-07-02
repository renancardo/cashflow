import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyAmount } from "./MoneyAmount.js";

const meta: Meta<typeof MoneyAmount> = {
  title: "Atoms/MoneyAmount",
  component: MoneyAmount,
  tags: ["autodocs"],
  argTypes: {
    language: {
      control: "select",
      options: ["pt-BR", "en"],
    },
    tone: {
      control: "select",
      options: ["default", "income", "danger"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof MoneyAmount>;

export const BrazilianReal: Story = {
  args: {
    cents: 500_000,
    language: "pt-BR",
  },
};

export const EnglishLocale: Story = {
  args: {
    cents: 125_050,
    language: "en",
  },
};

export const Income: Story = {
  args: {
    cents: 850_000,
    tone: "income",
  },
};

export const BelowBuffer: Story = {
  args: {
    cents: -42_300,
    tone: "danger",
  },
};
