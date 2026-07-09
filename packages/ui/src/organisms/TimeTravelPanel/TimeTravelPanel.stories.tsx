import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TimeTravelPanel } from "./TimeTravelPanel.js";

const meta: Meta<typeof TimeTravelPanel> = {
  title: "Organisms/TimeTravelPanel",
  component: TimeTravelPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof TimeTravelPanel>;

function InteractiveStory() {
  const [open, setOpen] = useState(true);
  const [today, setToday] = useState("2026-06-28");
  const [applyError, setApplyError] = useState<string | null>(null);

  const stepDays = (days: number) => {
    const date = new Date(`${today}T00:00:00`);
    date.setDate(date.getDate() + days);
    const iso = date.toISOString().slice(0, 10);
    setToday(iso);
    setApplyError(null);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open panel
      </button>
      <TimeTravelPanel
        open={open}
        today={today}
        applyError={applyError}
        onClose={() => setOpen(false)}
        onApply={(iso) => {
          if (iso < today) {
            setApplyError("Cannot travel to a date before the current simulated date.");
            return;
          }
          setToday(iso);
          setApplyError(null);
        }}
        onStepDays={stepDays}
        onRestoreSeed={() => {
          setToday("2026-06-28");
          setApplyError(null);
        }}
      />
    </>
  );
}

export const Default: Story = {
  render: () => <InteractiveStory />,
};

export const WithError: Story = {
  args: {
    open: true,
    today: "2026-07-01",
    applyError: "Cannot travel to a date before the current simulated date.",
    onClose: () => {},
    onApply: () => {},
    onStepDays: () => {},
    onRestoreSeed: () => {},
  },
};
