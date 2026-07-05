import { useEffect, useMemo, useState } from "react";
import type { Recurrence, TxType } from "@cashflow/core";
import { TX_TYPES, fmt, formatCents, parseMoney, txTypeLabel } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import { weekdayLongLabels, monthShortLabels } from "../../lib/calendar.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./PlannedItemEditorPanel.module.css";

export type PlannedItemEditorValues = {
  type: TxType;
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  recurrence: Recurrence;
  interval: number;
  dayOfMonth?: number;
  weekday?: number;
  monthOfYear?: number;
  startDate: string;
  endDate?: string;
  isSubscription: boolean;
  isActive: boolean;
};

type OccurrencePreview = {
  occurrenceDate: string;
  effectiveDate: string;
  amountCents: number;
};

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: PlannedItemEditorValues;
  currency?: string;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  occurrencePreview?: OccurrencePreview[];
  onMarkOccurrencePaid?: (occurrenceDate: string) => void;
  onChange: (patch: Partial<PlannedItemEditorValues>) => void;
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

export function PlannedItemEditorPanel({
  open,
  mode,
  values,
  currency = "BRL",
  accountOptions,
  categoryOptions,
  occurrencePreview = [],
  onMarkOccurrencePaid,
  onChange,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const m = useMessages();
  const e = m.forecast.editor;

  const recurrenceOptions = useMemo(
    () => [
      { value: "once" as const, label: e.recurrenceOnce },
      { value: "weekly" as const, label: e.recurrenceWeekly },
      { value: "monthly" as const, label: e.recurrenceMonthly },
      { value: "yearly" as const, label: e.recurrenceYearly },
    ],
    [e],
  );

  const weekdayOptions = useMemo(() => {
    const labels = weekdayLongLabels(m.calendar.weekdays.long);
    return labels.map((label, value) => ({ value, label }));
  }, [m.calendar.weekdays.long]);

  const monthOptions = useMemo(
    () =>
      monthShortLabels(m.calendar.months.short).map((label, index) => ({
        value: index + 1,
        label,
      })),
    [m.calendar.months.short],
  );

  const isTransfer = values.type === "transfer";
  const filteredCategories = categoryOptions.filter((c) =>
    values.type === "income" ? c.kind === "income" : c.kind === "expense",
  );
  const toAccountOptions = accountOptions.filter((a) => a.id !== values.accountId);

  const canSave =
    values.description.trim().length > 0 &&
    values.amountCents > 0 &&
    values.accountId.length > 0 &&
    values.startDate.length > 0 &&
    (isTransfer
      ? Boolean(values.toAccountId && values.toAccountId !== values.accountId)
      : Boolean(values.categoryId));

  const intervalLabel =
    values.recurrence === "weekly"
      ? e.intervalEveryWeeks
      : values.recurrence === "monthly"
        ? e.intervalEveryMonths
        : values.recurrence === "yearly"
          ? e.intervalEveryYears
          : "";

  const subtitle =
    mode === "edit"
      ? fmt(e.editForecastItemSubtitle, {
          description: values.description || m.common.unknown,
          recurrence: values.recurrence,
        })
      : fmt(e.newForecastItemSubtitle, {
          type: txTypeLabel(m, values.type).toLowerCase(),
        });

  const markPaidLabel = values.type === "income" ? m.common.markAsReceived : m.common.markPaid;
  const previewAmountTone =
    values.type === "income" ? "income" : values.type === "expense" ? "danger" : "default";

  return (
    <EditorPanel
      open={open}
      labelId="planned-item-editor-title"
      title={mode === "create" ? e.addForecastItem : e.editForecastItem}
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
              {mode === "create" ? e.addItem : m.common.saveChanges}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <SegmentedControl
        aria-label={m.common.form.itemType}
        value={values.type}
        onChange={(type) => onChange({ type })}
        options={TX_TYPES.map((type) => ({ value: type, label: txTypeLabel(m, type) }))}
      />

      <FormField
        id="fc-description"
        label={m.common.form.description}
        value={values.description}
        required
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className={styles.row}>
        <MoneyField
          id="fc-amount"
          label={m.common.form.amount}
          placeholder={m.common.form.placeholderAmount}
          currency={currency}
          cents={values.amountCents}
          required
          onCentsChange={(cents) => onChange({ amountCents: cents })}
        />
        {!isTransfer && (
          <FormField
            id="fc-category"
            label={m.common.form.category}
            inputType="select"
            value={values.categoryId ?? ""}
            required
            onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
          >
            <option value="">{m.common.form.selectCategory}</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </FormField>
        )}
      </div>

      <div className={styles.row}>
        <FormField
          id="fc-account"
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
        {isTransfer && (
          <FormField
            id="fc-to"
            label={m.common.form.toAccount}
            inputType="select"
            value={values.toAccountId ?? ""}
            required
            onChange={(e) => onChange({ toAccountId: e.target.value || undefined })}
          >
            <option value="">{m.common.form.selectAccount}</option>
            {toAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </FormField>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{m.common.form.recurrence}</h3>
        <div className={styles.row}>
          <FormField
            id="fc-recurrence"
            label={e.recurrencePattern}
            inputType="select"
            value={values.recurrence}
            onChange={(e) => onChange({ recurrence: e.target.value as Recurrence })}
          >
            {recurrenceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormField>
          {values.recurrence !== "once" && (
            <FormField
              id="fc-interval"
              label={intervalLabel}
              type="number"
              min="1"
              value={String(values.interval)}
              onChange={(e) => onChange({ interval: Math.max(1, Number(e.target.value) || 1) })}
            />
          )}
        </div>

        <div className={styles.row}>
          {(values.recurrence === "monthly" || values.recurrence === "yearly") && (
            <FormField
              id="fc-day-of-month"
              label={m.common.form.dayOfMonth}
              type="number"
              min={1}
              max={31}
              value={String(values.dayOfMonth ?? 1)}
              onChange={(e) => onChange({ dayOfMonth: Number(e.target.value) || 1 })}
            />
          )}
          {values.recurrence === "weekly" && (
            <FormField
              id="fc-weekday"
              label={e.weekday}
              inputType="select"
              value={String(values.weekday ?? 0)}
              onChange={(e) => onChange({ weekday: Number(e.target.value) })}
            >
              {weekdayOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormField>
          )}
          {values.recurrence === "yearly" && (
            <FormField
              id="fc-month-of-year"
              label={m.common.form.month}
              inputType="select"
              value={String(values.monthOfYear ?? 1)}
              onChange={(e) => onChange({ monthOfYear: Number(e.target.value) })}
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormField>
          )}
        </div>

        <div className={styles.row}>
          <FormField
            id="fc-start-date"
            label={values.recurrence === "once" ? m.common.form.date : e.startDate}
            type="date"
            value={values.startDate}
            required
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
          {values.recurrence !== "once" && (
            <FormField
              id="fc-end-date"
              label={e.endDate}
              type="date"
              value={values.endDate ?? ""}
              hint={e.endDateHint}
              onChange={(e) => onChange({ endDate: e.target.value || undefined })}
            />
          )}
        </div>
      </div>

      {values.recurrence !== "once" && (
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>{e.subscriptionLabel}</div>
            <div className={styles.toggleHint}>{e.subscriptionHint}</div>
          </div>
          <Toggle
            checked={values.isSubscription}
            aria-label={m.common.form.isSubscription}
            onChange={(checked) => onChange({ isSubscription: checked })}
          />
        </div>
      )}

      <div className={styles.toggleRow}>
        <div>
          <div className={styles.toggleLabel}>{m.common.active}</div>
          <div className={styles.toggleHint}>{e.activeHint}</div>
        </div>
        <Toggle
          checked={values.isActive}
          aria-label={m.common.active}
          onChange={(checked) => onChange({ isActive: checked })}
        />
      </div>

      {occurrencePreview.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{m.common.form.upcomingOccurrences}</h3>
          <ul className={styles.previewList}>
            {occurrencePreview.map((occ) => (
              <li key={occ.occurrenceDate} className={styles.previewItem}>
                <FormattedDate isoDate={occ.effectiveDate} />
                <div className={styles.previewActions}>
                  <MoneyAmount cents={occ.amountCents} tone={previewAmountTone} />
                  {onMarkOccurrencePaid && (
                    <Button
                      variant="ghost"
                      className={styles.markPaid}
                      onClick={() => onMarkOccurrencePaid(occ.occurrenceDate)}
                    >
                      {markPaidLabel}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </EditorPanel>
  );
}
