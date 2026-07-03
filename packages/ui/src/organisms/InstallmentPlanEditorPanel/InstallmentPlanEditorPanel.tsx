import { useEffect, useState } from "react";
import { formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./InstallmentPlanEditorPanel.module.css";

export type InstallmentPlanEditorValues = {
  description: string;
  accountId: string;
  categoryId?: string;
  installmentAmountCents: number;
  installmentCount: number;
  firstDueDate: string;
  dayOfMonth: number;
  isActive: boolean;
};

type SchedulePreviewRow = {
  index: number;
  dueDate: string;
  amountCents: number;
  status: "scheduled" | "paid";
};

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: InstallmentPlanEditorValues;
  currency?: string;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  schedulePreview?: SchedulePreviewRow[];
  onChange: (patch: Partial<InstallmentPlanEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

function MoneyField({
  id,
  label,
  currency,
  cents,
  required,
  onCentsChange,
}: {
  id: string;
  label: string;
  currency: string;
  cents: number;
  required?: boolean;
  onCentsChange: (cents: number) => void;
}) {
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
      prefix={currency}
      placeholder="0.00"
      value={draft}
      required={required}
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        onCentsChange(parseMoney(text) ?? 0);
      }}
      onBlur={() => setDraft(formatCents(parseMoney(draft)))}
    />
  );
}

export function InstallmentPlanEditorPanel({
  open,
  mode,
  values,
  currency = "BRL",
  accountOptions,
  categoryOptions,
  schedulePreview = [],
  onChange,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const canSave =
    values.description.trim().length > 0 &&
    values.installmentAmountCents > 0 &&
    values.installmentCount >= 1 &&
    values.accountId.length > 0 &&
    values.firstDueDate.length > 0;

  const subtitle =
    mode === "edit"
      ? `${values.description || "Installment plan"} · ${values.installmentCount} installments`
      : "New installment plan";

  return (
    <EditorPanel
      open={open}
      labelId="installment-plan-editor-title"
      title={mode === "create" ? "Add installment plan" : "Edit installment plan"}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={() => {
        if (canSave) onSave();
      }}
      footer={
        <>
          {mode === "edit" && onDelete && (
            <Button variant="ghost" className={styles.deleteButton} onClick={onDelete}>
              Delete
            </Button>
          )}
          <EditorPanelFooterActions>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={!canSave}>
              {mode === "create" ? "Add plan" : "Save changes"}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="ip-description"
        label="Description"
        value={values.description}
        required
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className={styles.row}>
        <MoneyField
          id="ip-amount"
          label="Installment amount"
          currency={currency}
          cents={values.installmentAmountCents}
          required
          onCentsChange={(cents) => onChange({ installmentAmountCents: cents })}
        />
        <FormField
          id="ip-count"
          label="Installment count"
          type="number"
          min={1}
          value={String(values.installmentCount)}
          required
          onChange={(e) => onChange({ installmentCount: Math.max(1, Number(e.target.value) || 1) })}
        />
      </div>

      <div className={styles.row}>
        <FormField
          id="ip-first-due"
          label="First due date"
          type="date"
          value={values.firstDueDate}
          required
          onChange={(e) => {
            const date = e.target.value;
            const day = date ? Number(date.slice(8, 10)) : values.dayOfMonth;
            onChange({ firstDueDate: date, dayOfMonth: day });
          }}
        />
        <FormField
          id="ip-day-of-month"
          label="Day of month"
          type="number"
          min={1}
          max={31}
          value={String(values.dayOfMonth)}
          onChange={(e) => onChange({ dayOfMonth: Number(e.target.value) || 1 })}
        />
      </div>

      <div className={styles.row}>
        <FormField
          id="ip-account"
          label="Account"
          inputType="select"
          value={values.accountId}
          required
          onChange={(e) => onChange({ accountId: e.target.value })}
        >
          <option value="">Select account</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </FormField>
        <FormField
          id="ip-category"
          label="Category"
          inputType="select"
          value={values.categoryId ?? ""}
          onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
        >
          <option value="">Optional</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </FormField>
      </div>

      <div className={styles.toggleRow}>
        <div>
          <div className={styles.toggleLabel}>Active</div>
          <div className={styles.toggleHint}>
            Paused plans stay visible but are excluded from projection
          </div>
        </div>
        <Toggle
          checked={values.isActive}
          aria-label="Active"
          onChange={(checked) => onChange({ isActive: checked })}
        />
      </div>

      {schedulePreview.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Schedule preview</h3>
          <div className={styles.schedule}>
            <div className={styles.scheduleHeader}>
              <span>#</span>
              <span>Due</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {schedulePreview.slice(0, 8).map((row) => (
              <div key={row.index} className={styles.scheduleRow}>
                <span>{row.index}</span>
                <span>
                  <FormattedDate isoDate={row.dueDate} />
                </span>
                <span>
                  <MoneyAmount cents={row.amountCents} />
                </span>
                <span>
                  <Chip variant={row.status === "paid" ? "income" : "default"}>
                    {row.status === "paid" ? "Paid" : "Scheduled"}
                  </Chip>
                </span>
              </div>
            ))}
            {schedulePreview.length > 8 && (
              <p className={styles.scheduleMore}>+ {schedulePreview.length - 8} more</p>
            )}
          </div>
        </div>
      )}
    </EditorPanel>
  );
}
