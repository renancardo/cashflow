import { useEffect, useState } from "react";
import { fmt, formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  placeholder,
  currency,
  cents,
  required,
  onCentsChange,
}: {
  id: string;
  label: string;
  placeholder: string;
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
      placeholder={placeholder}
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
  const m = useMessages();
  const e = m.forecast.editor;

  const canSave =
    values.description.trim().length > 0 &&
    values.installmentAmountCents > 0 &&
    values.installmentCount >= 1 &&
    values.accountId.length > 0 &&
    values.firstDueDate.length > 0;

  const subtitle =
    mode === "edit"
      ? fmt(e.editInstallmentPlanSubtitle, {
          description: values.description || m.common.unknown,
          count: values.installmentCount,
        })
      : e.newInstallmentPlanSubtitle;

  return (
    <EditorPanel
      open={open}
      labelId="installment-plan-editor-title"
      title={mode === "create" ? e.addInstallmentPlan : e.editInstallmentPlan}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={() => {
        if (canSave) onSave();
      }}
      footer={
        <>
          {mode === "edit" && onDelete && (
            <Button variant="ghost" className={styles.deleteButton} onClick={onDelete}>
              {m.common.delete}
            </Button>
          )}
          <EditorPanelFooterActions>
            <Button variant="ghost" onClick={onClose}>
              {m.common.cancel}
            </Button>
            <Button variant="primary" type="submit" disabled={!canSave}>
              {mode === "create" ? e.addPlan : m.common.saveChanges}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="ip-description"
        label={m.common.form.description}
        value={values.description}
        required
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className={styles.row}>
        <MoneyField
          id="ip-amount"
          label={e.installmentAmount}
          placeholder={m.common.form.placeholderAmount}
          currency={currency}
          cents={values.installmentAmountCents}
          required
          onCentsChange={(cents) => onChange({ installmentAmountCents: cents })}
        />
        <FormField
          id="ip-count"
          label={e.installmentCount}
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
          label={e.firstDueDate}
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
          label={m.common.form.dayOfMonth}
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
          label={m.common.form.account}
          inputType="select"
          value={values.accountId}
          required
          onChange={(e) => onChange({ accountId: e.target.value })}
        >
          <option value="">{m.common.form.selectAccount}</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </FormField>
        <FormField
          id="ip-category"
          label={m.common.form.category}
          inputType="select"
          value={values.categoryId ?? ""}
          onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
        >
          <option value="">{m.common.optional}</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </FormField>
      </div>

      <div className={styles.toggleRow}>
        <div>
          <div className={styles.toggleLabel}>{m.common.active}</div>
          <div className={styles.toggleHint}>{e.activePlanHint}</div>
        </div>
        <Toggle
          checked={values.isActive}
          aria-label={m.common.active}
          onChange={(checked) => onChange({ isActive: checked })}
        />
      </div>

      {schedulePreview.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{m.common.form.schedulePreview}</h3>
          <div className={styles.schedule}>
            <div className={styles.scheduleHeader}>
              <span>{m.forecast.headers.schedule.number}</span>
              <span>{m.forecast.headers.schedule.due}</span>
              <span>{m.forecast.headers.schedule.amount}</span>
              <span>{m.forecast.headers.schedule.status}</span>
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
                    {row.status === "paid" ? m.common.paid : m.common.scheduled}
                  </Chip>
                </span>
              </div>
            ))}
            {schedulePreview.length > 8 && (
              <p className={styles.scheduleMore}>
                {fmt(e.scheduleMore, { count: schedulePreview.length - 8 })}
              </p>
            )}
          </div>
        </div>
      )}
    </EditorPanel>
  );
}
