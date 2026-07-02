import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountsScreen } from "../organisms/AccountsScreen/AccountsScreen.js";
import { DEMO_ACCOUNTS, DEMO_WORKING_BALANCE_CENTS } from "../fixtures/accounts.js";

const meta: Meta<typeof AccountsScreen> = {
  title: "Pages/AccountsScreen",
  component: AccountsScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AccountsScreen>;

export const WithAccounts: Story = {
  render: function Render() {
    const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);

    return (
      <AccountsScreen
        accounts={accounts}
        workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
        onWorkingChange={(id, isWorking) =>
          setAccounts((current) =>
            current.map((account) => (account.id === id ? { ...account, isWorking } : account)),
          )
        }
      />
    );
  },
};

export const Empty: Story = {
  args: {
    accounts: [],
    workingBalanceCents: 0,
  },
};

export const Loading: Story = {
  args: {
    accounts: [],
    workingBalanceCents: 0,
    status: "loading",
  },
};

export const Error: Story = {
  args: {
    accounts: [],
    workingBalanceCents: 0,
    status: "error",
    errorMessage: "Failed to read accounts from storage.",
  },
};
