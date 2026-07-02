import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppStatus } from "./AppStatus.js";

const meta: Meta<typeof AppStatus> = {
  title: "Organisms/AppStatus",
  component: AppStatus,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AppStatus>;

export const Loading: Story = {
  args: {
    title: "Loading projection",
    children: "Fetching accounts and transactions…",
  },
};

export const Error: Story = {
  args: {
    title: "Could not load data",
    children: "Check your connection and try again.",
  },
};
