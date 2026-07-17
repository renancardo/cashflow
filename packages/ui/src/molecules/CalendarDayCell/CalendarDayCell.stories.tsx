import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarDayCell } from "./CalendarDayCell.js";

const meta: Meta<typeof CalendarDayCell> = {
  title: "Molecules/CalendarDayCell",
  component: CalendarDayCell,
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["past", "today", "future"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof CalendarDayCell>;

export const Empty: Story = {
  args: {
    day: 12,
    state: "future",
    indicators: [],
  },
};

export const BelowBuffer: Story = {
  name: "Red dot (below buffer)",
  args: {
    day: 15,
    state: "future",
    indicators: ["danger"],
  },
};

export const IncomeDay: Story = {
  name: "Income indicator",
  args: {
    day: 5,
    state: "future",
    indicators: ["success"],
  },
};

export const TodayWithIndicators: Story = {
  args: {
    day: 2,
    state: "today",
    indicators: ["danger", "success"],
  },
};

export const PastMuted: Story = {
  args: {
    day: 28,
    state: "past",
    indicators: ["warning"],
  },
};

export const Overdue: Story = {
  name: "Overdue bar",
  args: {
    day: 10,
    state: "future",
    overdue: true,
    indicators: [],
  },
};
