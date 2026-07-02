import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountRow } from "./AccountRow.js";
import { DEMO_ACCOUNTS } from "../../fixtures/accounts.js";

const meta: Meta<typeof AccountRow> = {
  title: "Organisms/AccountRow",
  component: AccountRow,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AccountRow>;

export const Checking: Story = {
  args: {
    account: DEMO_ACCOUNTS[0],
  },
};

export const CreditCard: Story = {
  args: {
    account: DEMO_ACCOUNTS[2],
  },
};
