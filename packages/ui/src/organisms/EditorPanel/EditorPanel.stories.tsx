import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../../atoms/Button/Button.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { EditorPanel, EditorPanelFooterActions } from "./EditorPanel.js";

const meta: Meta<typeof EditorPanel> = {
  title: "Organisms/EditorPanel",
  component: EditorPanel,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof EditorPanel>;

const archiveBtnStyle: React.CSSProperties = { color: "var(--color-danger)" };

function DemoStory() {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState("Example item");

  return (
    <EditorPanel
      open={open}
      labelId="demo-editor-title"
      title="Edit item"
      subtitle="Example item · demo"
      onClose={() => setOpen(false)}
      onSubmit={() => setOpen(false)}
      footer={
        <>
          <span style={archiveBtnStyle}>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Archive
            </Button>
          </span>
          <EditorPanelFooterActions>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save changes
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="demo-name"
        label="Name"
        value={name}
        placeholder="Item name"
        onChange={(e) => setName(e.target.value)}
        required
      />
    </EditorPanel>
  );
}

export const Default: Story = {
  render: () => <DemoStory />,
};
