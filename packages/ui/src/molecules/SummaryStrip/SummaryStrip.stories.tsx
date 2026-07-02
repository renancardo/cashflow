import type { Meta, StoryObj } from "@storybook/react-vite";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { SummaryStrip, SummaryStripItem } from "./SummaryStrip.js";

const meta: Meta<typeof SummaryStrip> = {
  title: "Molecules/SummaryStrip",
  component: SummaryStrip,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SummaryStrip>;

export const AccountsSummary: Story = {
  render: () => (
    <SummaryStrip>
      <SummaryStripItem label="Total accounts">5</SummaryStripItem>
      <SummaryStripItem label="Working accounts" tone="working">
        3
      </SummaryStripItem>
      <SummaryStripItem label="Aggregate working">
        <MoneyAmount cents={1_245_000} />
      </SummaryStripItem>
    </SummaryStrip>
  ),
};
