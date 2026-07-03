import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button/Button.js";
import { Tooltip } from "./Tooltip.js";

const meta: Meta<typeof Tooltip> = {
  title: "Atoms/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {
    placement: {
      control: "select",
      options: ["top", "bottom", "left", "right"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem 6rem" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    content: "Include in working balance",
    placement: "top",
    children: <Button variant="ghost">Working account</Button>,
  },
};

export const DisabledButton: Story = {
  name: "Disabled button",
  render: () => (
    <div style={{ alignSelf: "flex-start", paddingLeft: "1.25rem" }}>
      <Tooltip align="start" content="Accounts can only be archived when the balance is zero.">
        <Button variant="ghost" disabled>
          Archive
        </Button>
      </Tooltip>
    </div>
  ),
};

export const LongContent: Story = {
  name: "Long content",
  args: {
    content:
      "Forecasts are projected forward from the anchor balance. Update transactions before archiving.",
    placement: "top",
    children: <Button variant="primary">Save changes</Button>,
  },
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "5rem", justifyItems: "center" }}>
      <Tooltip content="Top placement" placement="top">
        <Button variant="ghost">Top</Button>
      </Tooltip>
      <Tooltip content="Bottom placement" placement="bottom">
        <Button variant="ghost">Bottom</Button>
      </Tooltip>
      <div style={{ display: "flex", gap: "8rem" }}>
        <Tooltip content="Left placement" placement="left">
          <Button variant="ghost">Left</Button>
        </Tooltip>
        <Tooltip content="Right placement" placement="right">
          <Button variant="ghost">Right</Button>
        </Tooltip>
      </div>
    </div>
  ),
};
