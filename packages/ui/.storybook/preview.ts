import type { Preview } from "@storybook/react-vite";
import "../src/tokens/paper.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "paper",
      values: [{ name: "paper", value: "#faf8f5" }],
    },
  },
};

export default preview;
