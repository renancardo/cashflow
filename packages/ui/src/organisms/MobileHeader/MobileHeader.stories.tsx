import type { Meta, StoryObj } from "@storybook/react-vite";
import { MobileHeader } from "./MobileHeader.js";

const meta: Meta<typeof MobileHeader> = {
  title: "Organisms/MobileHeader",
  component: MobileHeader,
  tags: ["autodocs"],
  parameters: {
    viewport: { defaultViewport: "mobile1" },
  },
};

export default meta;
type Story = StoryObj<typeof MobileHeader>;

export const Accounts: Story = {
  args: {
    title: "Accounts",
  },
};
