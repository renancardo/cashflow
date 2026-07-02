import type { Meta, StoryObj } from "@storybook/react-vite";
import { Indicator } from "./Indicator.js";

const meta: Meta<typeof Indicator> = {
  title: "Atoms/Indicator",
  component: Indicator,
  tags: ["autodocs"],
  argTypes: {
    kind: {
      control: "select",
      options: ["danger", "success", "warning", "card"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Indicator>;

export const BelowBuffer: Story = {
  name: "Below buffer (danger)",
  args: { kind: "danger" },
};

export const Income: Story = {
  args: { kind: "success" },
};

export const LargeOutflow: Story = {
  name: "Large outflow (warning)",
  args: { kind: "warning" },
};

export const CardStatement: Story = {
  name: "Card statement",
  args: { kind: "card" },
};

export const AllKinds: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <Indicator kind="danger" />
      <Indicator kind="success" />
      <Indicator kind="warning" />
      <Indicator kind="card" />
    </div>
  ),
};
