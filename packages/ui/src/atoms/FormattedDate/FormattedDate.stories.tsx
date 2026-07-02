import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormattedDate } from "./FormattedDate.js";

const meta: Meta<typeof FormattedDate> = {
  title: "Atoms/FormattedDate",
  component: FormattedDate,
  tags: ["autodocs"],
  argTypes: {
    language: {
      control: "select",
      options: ["pt-BR", "en"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormattedDate>;

export const BrazilianPortuguese: Story = {
  args: {
    isoDate: "2026-07-02",
    language: "pt-BR",
  },
};

export const English: Story = {
  args: {
    isoDate: "2026-07-02",
    language: "en",
  },
};
