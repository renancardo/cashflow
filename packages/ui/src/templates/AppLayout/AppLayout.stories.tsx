import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppLayout } from "./AppLayout.js";
import { AccountsScreen } from "../../organisms/AccountsScreen/AccountsScreen.js";
import {
  AccountEditorPanel,
  type AccountEditorValues,
} from "../../organisms/AccountEditorPanel/AccountEditorPanel.js";
import { DEMO_ACCOUNTS, DEMO_WORKING_BALANCE_CENTS } from "../../fixtures/accounts.js";

const meta: Meta<typeof AppLayout> = {
  title: "Templates/AppLayout",
  component: AppLayout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

const editorSeed: AccountEditorValues = {
  name: "Cartão Cora",
  type: "credit_card",
  currency: "BRL",
  isWorking: false,
  anchorBalanceCents: 185_000,
  anchorDate: "2026-06-01",
  closingDay: 25,
  dueDay: 3,
  creditLimitCents: 800_000,
  defaultPayFromAccountId: "cora-checking",
  institution: "Cora",
};

export const AccountsPage: Story = {
  render: function Render() {
    const [accounts, setAccounts] = useState(DEMO_ACCOUNTS);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorValues, setEditorValues] = useState(editorSeed);

    return (
      <AppLayout activePath="/accounts" mobileTitle="Accounts">
        <AccountsScreen
          accounts={accounts}
          workingBalanceCents={DEMO_WORKING_BALANCE_CENTS}
          onAddAccount={() => setEditorOpen(true)}
          onEdit={() => {
            setEditorValues(editorSeed);
            setEditorOpen(true);
          }}
          onWorkingChange={(id, isWorking) =>
            setAccounts((current) =>
              current.map((account) => (account.id === id ? { ...account, isWorking } : account)),
            )
          }
          editor={
            <AccountEditorPanel
              open={editorOpen}
              mode="edit"
              values={editorValues}
              payFromOptions={[
                { id: "cora-checking", name: "Cora Checking" },
                { id: "wallet", name: "Carteira" },
              ]}
              onChange={(patch) => setEditorValues((current) => ({ ...current, ...patch }))}
              onClose={() => setEditorOpen(false)}
              onSave={() => setEditorOpen(false)}
              onArchive={() => setEditorOpen(false)}
            />
          }
        />
      </AppLayout>
    );
  },
};
