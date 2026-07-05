import { useEffect, useState } from "react";
import { fmt, formatCents, parseMoney, type CategoryKind } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Tooltip } from "../../atoms/Tooltip/Tooltip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  placeholder: string;
  cents: number | undefined;
  hint?: string;
  onCentsChange: (cents: number | undefined) => void;
};

function MoneyField({ id, label, placeholder, cents, hint, onCentsChange }: MoneyFieldProps) {
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
      placeholder={placeholder}
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
  const m = useMessages();
  const ed = m.categories.editor;

  const canSave = values.name.trim().length > 0;
  const isExpense = values.kind === "expense";
  const isChild = !!values.parentId;
  const kindLabel = m.common.kind[values.kind];

  const subtitle =
    mode === "edit"
      ? fmt(ed.editCategorySubtitle, {
          name: values.name,
          kind: kindLabel,
          suffix: isChild ? ed.subcategorySuffix : ed.parentSuffix,
        })
      : fmt(ed.newCategorySubtitle, { kind: kindLabel.toLowerCase() });

  return (
    <EditorPanel
      open={open}
      labelId="category-editor-title"
      title={mode === "create" ? ed.addTitle : ed.editTitle}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={() => {
        if (canSave) onSave();
      }}
      footer={
        <>
          {mode === "edit" && onArchive && (
            <Tooltip align="start" content={ed.archiveTooltip}>
              <Button variant="ghost" className={styles.archiveButton} onClick={onArchive}>
                {m.common.archive}
              </Button>
            </Tooltip>
          )}
          <EditorPanelFooterActions>
            <Button variant="ghost" onClick={onClose}>
              {m.common.cancel}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!canSave}
              className={styles.saveButton}
            >
              {mode === "create" ? ed.addSubmit : m.common.saveChanges}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="cat-name"
        label={m.common.form.name}
        value={values.name}
        placeholder={m.common.form.placeholderCategoryName}
        onChange={(event) => onChange({ name: event.target.value })}
        required
      />

      <div className={styles.row}>
        <FormField
          id="cat-kind"
          label={m.common.form.type}
          inputType="select"
          value={values.kind}
          onChange={(event) =>
            onChange({ kind: event.target.value as CategoryKind, parentId: undefined })
          }
        >
          <option value="expense">{m.common.kind.expense}</option>
          <option value="income">{m.common.kind.income}</option>
        </FormField>

        <div className={styles.colorField}>
          <label className={styles.colorLabel} htmlFor="cat-color">
            {m.common.form.color}
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
        label={m.common.form.parentCategory}
        inputType="select"
        value={values.parentId ?? ""}
        hint={parentOptions.length === 0 ? ed.parentHintEmpty : ed.parentHint}
        onChange={(event) => onChange({ parentId: event.target.value || undefined })}
      >
        <option value="">{m.common.form.noneRootCategory}</option>
        {parentOptions.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </FormField>

      {isExpense && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{ed.monthlyBudgetTitle}</h3>
          <p className={styles.sectionHint}>{ed.monthlyBudgetHint}</p>
          <div className={styles.row}>
            <MoneyField
              id="cat-budget-amount"
              label={m.common.form.amount}
              placeholder={m.common.form.placeholderAmount}
              cents={values.budgetCents}
              hint={m.common.form.placeholderLeaveEmptyNoBudget}
              onCentsChange={(cents) => onChange({ budgetCents: cents })}
            />
            <FormField
              id="cat-budget-month"
              label={ed.effectiveFrom}
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
