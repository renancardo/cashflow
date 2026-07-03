import type { Meta, StoryObj } from "@storybook/react-vite";
import { SideNav } from "./SideNav.js";

const meta: Meta<typeof SideNav> = {
  title: "Organisms/SideNav",
  component: SideNav,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SideNav>;

export const Desktop: Story = {
  args: {
    activePath: "/accounts",
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Story />
        <div style={{ flex: 1, padding: 24 }}>Main content</div>
      </div>
    ),
  ],
};

export const MobileOpen: Story = {
  args: {
    activePath: "/accounts",
    open: true,
  },
};
