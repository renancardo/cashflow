import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormField } from "./FormField.js";

const meta: Meta<typeof FormField> = {
  title: "Molecules/FormField",
  component: FormField,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const TextInput: Story = {
  args: {
    id: "name",
    label: "Name",
    defaultValue: "Cora Checking",
  },
};

export const SelectField: Story = {
  render: () => (
    <FormField id="type" label="Type" inputType="select" defaultValue="checking">
      <option value="checking">Checking</option>
      <option value="savings">Savings</option>
    </FormField>
  ),
};
