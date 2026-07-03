import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Metric } from "./Metric.js";

const meta: Meta<typeof Metric> = {
  title: "Molecules/Metric",
  component: Metric,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Metric>;

export const WorkingBalance: Story = {
  args: {
    label: "Working balance",
  },
  render: (args) => (
    <Metric {...args}>
      <MoneyAmount cents={1_245_000} />
    </Metric>
  ),
};

export const Count: Story = {
  args: {
    label: "Total accounts",
    children: "5",
  },
};
