import type { Meta, StoryObj } from "@storybook/react-vite";
import { Toggle } from "./Toggle.js";

const meta: Meta<typeof Toggle> = {
  title: "Atoms/Toggle",
  component: Toggle,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Off: Story = {
  args: {
    checked: false,
    "aria-label": "Not working",
  },
};

export const On: Story = {
  args: {
    checked: true,
    "aria-label": "Working account",
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    "aria-label": "Disabled toggle",
  },
};
