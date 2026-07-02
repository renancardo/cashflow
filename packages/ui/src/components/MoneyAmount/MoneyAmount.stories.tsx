import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyAmount } from "./MoneyAmount.js";

const meta: Meta<typeof MoneyAmount> = {
  title: "Foundation/MoneyAmount",
  component: MoneyAmount,
  tags: ["autodocs"],
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
