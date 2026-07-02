import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "./Label.js";

const meta: Meta<typeof Label> = {
  title: "Atoms/Label",
  component: Label,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const FieldLabel: Story = {
  args: {
    children: "Working account",
    htmlFor: "working-account",
  },
};
