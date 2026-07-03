import { useEffect, useState } from "react";
import { formatCents, parseMoney, type CategoryKind } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Tooltip } from "../../atoms/Tooltip/Tooltip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./CategoryEditorPanel.module.css";

export type CategoryEditorValues = {
  name: string;
  kind: CategoryKind;
  color: string;
  parentId?: string;
  budgetCents?: number;
  budgetEffectiveFromMonth: string;
};

type ParentOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: CategoryEditorValues;
  /** Root categories of the same kind — only root cats can be parents. */
  parentOptions?: ParentOption[];
  onChange: (patch: Partial<CategoryEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onArchive?: () => void;
};

type MoneyFieldProps = {
  id: string;
  label: string;
  cents: number | undefined;
  hint?: string;
  onCentsChange: (cents: number | undefined) => void;
};

function MoneyField({ id, label, cents, hint, onCentsChange }: MoneyFieldProps) {
  const [draft, setDraft] = useState(() => formatCents(cents));

  useEffect(() => {
    setDraft((current) => (parseMoney(current) === cents ? current : formatCents(cents)));
  }, [cents]);

  return (
    <FormField
      id={id}
      label={label}
      type="text"
      inputMode="decimal"
      placeholder="0.00"
      value={draft}
      hint={hint}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        onCentsChange(parseMoney(text));
      }}
      onBlur={() => setDraft(formatCents(parseMoney(draft)))}
    />
  );
}

const KIND_LABELS: Record<CategoryKind, string> = {
  expense: "Expense",
  income: "Income",
};

export function CategoryEditorPanel({
  open,
  mode,
  values,
  parentOptions = [],
  onChange,
  onClose,
  onSave,
  onArchive,
}: Props) {
  const canSave = values.name.trim().length > 0;
  const isExpense = values.kind === "expense";
  const isChild = !!values.parentId;

  const subtitle =
    mode === "edit"
      ? `${values.name} · ${KIND_LABELS[values.kind]}${isChild ? " · subcategory" : " · parent"}`
      : `New ${KIND_LABELS[values.kind].toLowerCase()} category`;

  return (
    <EditorPanel
      open={open}
      labelId="category-editor-title"
      title={mode === "create" ? "Add category" : "Edit category"}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={() => {
        if (canSave) onSave();
      }}
      footer={
        <>
          {mode === "edit" && onArchive && (
            <Tooltip
              align="start"
              content="Archiving preserves historical transactions using this category."
            >
              <Button variant="ghost" className={styles.archiveButton} onClick={onArchive}>
                Archive
              </Button>
            </Tooltip>
          )}
          <EditorPanelFooterActions>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!canSave}
              className={styles.saveButton}
            >
              {mode === "create" ? "Add category" : "Save changes"}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="cat-name"
        label="Name"
        value={values.name}
        placeholder="e.g. Groceries"
        onChange={(event) => onChange({ name: event.target.value })}
        required
      />

      <div className={styles.row}>
        <FormField
          id="cat-kind"
          label="Kind"
          inputType="select"
          value={values.kind}
          onChange={(event) =>
            onChange({ kind: event.target.value as CategoryKind, parentId: undefined })
          }
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </FormField>

        <div className={styles.colorField}>
          <label className={styles.colorLabel} htmlFor="cat-color">
            Color
          </label>
          <div className={styles.colorRow}>
            <input
              id="cat-color"
              type="color"
              className={styles.colorPicker}
              value={values.color || "#6B7280"}
              onChange={(event) => onChange({ color: event.target.value })}
            />
            <span className={styles.colorHex}>{values.color || "#6B7280"}</span>
          </div>
        </div>
      </div>

      <FormField
        id="cat-parent"
        label="Parent category"
        inputType="select"
        value={values.parentId ?? ""}
        hint={
          parentOptions.length === 0
            ? "No root categories available for this kind"
            : "One level max — only root categories can be parents"
        }
        onChange={(event) => onChange({ parentId: event.target.value || undefined })}
      >
        <option value="">None (root category)</option>
        {parentOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </FormField>

      {isExpense && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Monthly budget</h3>
          <p className={styles.sectionHint}>
            Budgets apply to expense categories only. Changes take effect from the chosen month
            onward.
          </p>
          <div className={styles.row}>
            <MoneyField
              id="cat-budget-amount"
              label="Amount"
              cents={values.budgetCents}
              hint="Leave empty for no budget"
              onCentsChange={(cents) => onChange({ budgetCents: cents })}
            />
            <FormField
              id="cat-budget-month"
              label="Effective from"
              type="month"
              value={values.budgetEffectiveFromMonth}
              onChange={(event) => onChange({ budgetEffectiveFromMonth: event.target.value })}
            />
          </div>
        </div>
      )}
    </EditorPanel>
  );
}
