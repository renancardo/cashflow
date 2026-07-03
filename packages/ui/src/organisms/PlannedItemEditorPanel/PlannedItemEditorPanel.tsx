import { useEffect, useState } from "react";
import type { Recurrence, TxType } from "@cashflow/core";
import { TX_TYPES, TX_TYPE_LABELS, formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
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
  onChange: (patch: Partial<PlannedItemEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: "once", label: "Once" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
}));

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

export function PlannedItemEditorPanel({
  open,
  mode,
  values,
  currency = "BRL",
  accountOptions,
  categoryOptions,
  occurrencePreview = [],
  onChange,
  onClose,
  onSave,
  onDelete,
}: Props) {
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

  const intervalSuffix =
    values.recurrence === "weekly"
      ? "week(s)"
      : values.recurrence === "monthly"
        ? "month(s)"
        : values.recurrence === "yearly"
          ? "year(s)"
          : "";

  const subtitle =
    mode === "edit"
      ? `${values.description || "Forecast item"} · ${values.recurrence}`
      : `New ${TX_TYPE_LABELS[values.type].toLowerCase()} forecast item`;

  return (
    <EditorPanel
      open={open}
      labelId="planned-item-editor-title"
      title={mode === "create" ? "Add forecast item" : "Edit forecast item"}
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
              {mode === "create" ? "Add item" : "Save changes"}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <SegmentedControl
        aria-label="Item type"
        value={values.type}
        onChange={(type) => onChange({ type })}
        options={TX_TYPES.map((type) => ({ value: type, label: TX_TYPE_LABELS[type] }))}
      />

      <FormField
        id="fc-description"
        label="Description"
        value={values.description}
        required
        onChange={(e) => onChange({ description: e.target.value })}
      />

      <div className={styles.row}>
        <MoneyField
          id="fc-amount"
          label="Amount"
          currency={currency}
          cents={values.amountCents}
          required
          onCentsChange={(cents) => onChange({ amountCents: cents })}
        />
        {!isTransfer && (
          <FormField
            id="fc-category"
            label="Category"
            inputType="select"
            value={values.categoryId ?? ""}
            required
            onChange={(e) => onChange({ categoryId: e.target.value || undefined })}
          >
            <option value="">Select category</option>
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
        {isTransfer && (
          <FormField
            id="fc-to"
            label="To account"
            inputType="select"
            value={values.toAccountId ?? ""}
            required
            onChange={(e) => onChange({ toAccountId: e.target.value || undefined })}
          >
            <option value="">Select account</option>
            {toAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </FormField>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recurrence</h3>
        <div className={styles.row}>
          <FormField
            id="fc-recurrence"
            label="Pattern"
            inputType="select"
            value={values.recurrence}
            onChange={(e) => onChange({ recurrence: e.target.value as Recurrence })}
          >
            {RECURRENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FormField>
          {values.recurrence !== "once" && (
            <FormField
              id="fc-interval"
              label={`Every (${intervalSuffix})`}
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
              label="Day of month"
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
              label="Weekday"
              inputType="select"
              value={String(values.weekday ?? 0)}
              onChange={(e) => onChange({ weekday: Number(e.target.value) })}
            >
              {WEEKDAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </FormField>
          )}
          {values.recurrence === "yearly" && (
            <FormField
              id="fc-month-of-year"
              label="Month"
              inputType="select"
              value={String(values.monthOfYear ?? 1)}
              onChange={(e) => onChange({ monthOfYear: Number(e.target.value) })}
            >
              {MONTH_OPTIONS.map((opt) => (
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
            label={values.recurrence === "once" ? "Date" : "Start date"}
            type="date"
            value={values.startDate}
            required
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
          {values.recurrence !== "once" && (
            <FormField
              id="fc-end-date"
              label="End date"
              type="date"
              value={values.endDate ?? ""}
              hint="Leave empty for indefinite"
              onChange={(e) => onChange({ endDate: e.target.value || undefined })}
            />
          )}
        </div>
      </div>

      {values.recurrence !== "once" && (
        <div className={styles.toggleRow}>
          <div>
            <div className={styles.toggleLabel}>Subscription</div>
            <div className={styles.toggleHint}>Recurring charge on a card or account</div>
          </div>
          <Toggle
            checked={values.isSubscription}
            aria-label="Is subscription"
            onChange={(checked) => onChange({ isSubscription: checked })}
          />
        </div>
      )}

      <div className={styles.toggleRow}>
        <div>
          <div className={styles.toggleLabel}>Active</div>
          <div className={styles.toggleHint}>
            Paused items stay visible but are excluded from projection
          </div>
        </div>
        <Toggle
          checked={values.isActive}
          aria-label="Active"
          onChange={(checked) => onChange({ isActive: checked })}
        />
      </div>

      {occurrencePreview.length > 0 && values.recurrence !== "once" && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Upcoming occurrences</h3>
          <ul className={styles.previewList}>
            {occurrencePreview.map((occ) => (
              <li key={occ.effectiveDate} className={styles.previewItem}>
                <FormattedDate isoDate={occ.effectiveDate} />
                <MoneyAmount cents={occ.amountCents} tone="danger" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </EditorPanel>
  );
}
