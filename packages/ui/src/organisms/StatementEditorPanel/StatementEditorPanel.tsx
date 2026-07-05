import { useEffect, useState } from "react";
import type { StatementStatus } from "@cashflow/core";
import { formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { formatStatementPeriod } from "../../lib/statementDates.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./StatementEditorPanel.module.css";

export type StatementEditorValues = {
  plannedPaymentCents?: number;
  payFromAccountId?: string;
};

type AccountOption = { id: string; name: string };

type Props = {
  open: boolean;
  cardName: string;
  periodStart: string;
  closingDate: string;
  dueDate: string;
  computedTotalCents: number;
  includesOpeningDebt?: boolean;
  values: StatementEditorValues;
  status: StatementStatus;
  payFromOptions: AccountOption[];
  currency?: string;
  saving?: boolean;
  onChange: (patch: Partial<StatementEditorValues>) => void;
  onClose: () => void;
  onResetToFull: () => void;
  onRecordPayment?: () => void;
};

function MoneyField({
  id,
  label,
  currency,
  cents,
  onCentsChange,
}: {
  id: string;
  label: string;
  currency: string;
  cents: number;
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
      required
      onChange={(event) => {
        const text = event.target.value;
        setDraft(text);
        onCentsChange(parseMoney(text) ?? 0);
      }}
      onBlur={() => setDraft(formatCents(parseMoney(draft)))}
    />
  );
}

export function StatementEditorPanel({
  open,
  cardName,
  periodStart,
  closingDate,
  dueDate,
  computedTotalCents,
  includesOpeningDebt = false,
  values,
  status,
  payFromOptions,
  currency = "BRL",
  saving = false,
  onChange,
  onClose,
  onResetToFull,
  onRecordPayment,
}: Props) {
  const isPaid = status === "paid";
  const plannedCents = values.plannedPaymentCents ?? computedTotalCents;
  const hasOverride = values.plannedPaymentCents != null;
  const periodLabel = formatStatementPeriod(periodStart, closingDate);
  const canRecord = !isPaid && plannedCents > 0 && Boolean(onRecordPayment);

  return (
    <EditorPanel
      open={open}
      labelId="statement-editor-title"
      title="Edit statement payment"
      subtitle={`${cardName} · ${periodLabel}`}
      onClose={onClose}
      footer={
        <EditorPanelFooterActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          {onRecordPayment && (
            <Button
              variant="primary"
              type="button"
              disabled={saving || !canRecord}
              className={styles.recordButton}
              onClick={onRecordPayment}
            >
              Record payment
            </Button>
          )}
        </EditorPanelFooterActions>
      }
    >
      <div className={styles.section}>
        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>Computed total</span>
          <MoneyAmount cents={computedTotalCents} />
          {includesOpeningDebt && (
            <p className={styles.readOnlyHint}>Includes opening debt from card anchor</p>
          )}
        </div>

        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>Due date</span>
          <FormattedDate isoDate={dueDate} />
          {isPaid && <Chip variant="actual">paid ✓</Chip>}
        </div>

        {!isPaid && (
          <>
            <div className={styles.fieldRow}>
              <MoneyField
                id="statement-planned-payment"
                label="Planned payment"
                currency={currency}
                cents={plannedCents}
                onCentsChange={(cents) => onChange({ plannedPaymentCents: cents })}
              />
              {hasOverride && (
                <Button
                  variant="ghost"
                  type="button"
                  className={styles.resetButton}
                  onClick={onResetToFull}
                >
                  Reset to full
                </Button>
              )}
            </div>

            <FormField
              id="statement-pay-from"
              label="Pay from"
              inputType="select"
              value={values.payFromAccountId ?? ""}
              onChange={(event) => onChange({ payFromAccountId: event.target.value || undefined })}
            >
              <option value="">Default account</option>
              {payFromOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </FormField>
          </>
        )}
      </div>
    </EditorPanel>
  );
}
