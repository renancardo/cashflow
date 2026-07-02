import type { Meta, StoryObj } from "@storybook/react-vite";
import { BottomNav } from "./BottomNav.js";

const meta: Meta<typeof BottomNav> = {
  title: "Organisms/BottomNav",
  component: BottomNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { defaultViewport: "mobile1" },
  },
};

export default meta;
type Story = StoryObj<typeof BottomNav>;

export const AccountsActive: Story = {
  args: {
    activePath: "/accounts",
  },
};
