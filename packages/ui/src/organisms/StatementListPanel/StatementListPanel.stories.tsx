import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatementListPanel } from "./StatementListPanel.js";
import { DEMO_STATEMENT_CARD_NAME, DEMO_STATEMENT_ROWS } from "../../fixtures/statements.js";

const meta: Meta<typeof StatementListPanel> = {
  title: "Organisms/StatementListPanel",
  component: StatementListPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof StatementListPanel>;

function InteractiveStory() {
  const [open, setOpen] = useState(true);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open statements
      </button>
      <StatementListPanel
        open={open}
        cardName={DEMO_STATEMENT_CARD_NAME}
        statements={DEMO_STATEMENT_ROWS}
        onClose={() => setOpen(false)}
        onEdit={(id) => alert(`Edit statement ${id}`)}
        onNavigateToTransaction={(id) => alert(`Navigate to transaction ${id}`)}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <InteractiveStory />,
};

export const Empty: Story = {
  args: {
    open: true,
    cardName: DEMO_STATEMENT_CARD_NAME,
    statements: [],
    onClose: () => {},
  },
};

export const ReadOnly: Story = {
  args: {
    open: true,
    cardName: "Cartão Cora",
    statements: DEMO_STATEMENT_ROWS,
    onClose: () => {},
  },
};
