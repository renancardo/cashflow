import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SegmentedControl } from "./SegmentedControl.js";

const meta: Meta<typeof SegmentedControl> = {
  title: "Molecules/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState("all");

    return (
      <SegmentedControl
        aria-label="Filter by kind"
        value={value}
        onChange={setValue}
        options={[
          { value: "all", label: "All" },
          { value: "expense", label: "Expense" },
        ]}
      />
    );
  },
};

export const ThreeOptions: Story = {
  render: function Render() {
    const [value, setValue] = useState("all");

    return (
      <SegmentedControl
        aria-label="Filter by kind"
        value={value}
        onChange={setValue}
        options={[
          { value: "all", label: "All" },
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />
    );
  },
};

export const FourOptions: Story = {
  render: function Render() {
    const [value, setValue] = useState("all");

    return (
      <SegmentedControl
        aria-label="Filter by type"
        value={value}
        onChange={setValue}
        options={[
          { value: "all", label: "All types" },
          { value: "income", label: "Income" },
          { value: "expense", label: "Expense" },
          { value: "transfer", label: "Transfer" },
        ]}
      />
    );
  },
};

export const DisabledOption: Story = {
  render: function Render() {
    const [value, setValue] = useState("expense");

    return (
      <SegmentedControl
        aria-label="Filter by kind"
        value={value}
        onChange={setValue}
        options={[
          { value: "all", label: "All" },
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income", disabled: true },
        ]}
      />
    );
  },
};

export const FullWidth: Story = {
  render: function Render() {
    const [value, setValue] = useState("all");

    return (
      <div style={{ width: "100%", maxWidth: 480 }}>
        <SegmentedControl
          aria-label="Filter by kind"
          value={value}
          onChange={setValue}
          fullWidth
          options={[
            { value: "all", label: "All" },
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />
      </div>
    );
  },
};
