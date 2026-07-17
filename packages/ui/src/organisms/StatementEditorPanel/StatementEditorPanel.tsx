import { useEffect, useState } from "react";
import type { StatementStatus } from "@cashflow/core";
import { fmt, formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Chip } from "../../atoms/Chip/Chip.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { useMessages } from "../../i18n/LanguageContext.js";
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
  paidAmountCents?: number;
  includesOpeningDebt?: boolean;
  values: StatementEditorValues;
  status: StatementStatus;
  payFromOptions: AccountOption[];
  currency?: string;
  saving?: boolean;
  onChange: (patch: Partial<StatementEditorValues>) => void;
  onClose: () => void;
  onResetToFull: () => void;
  onSave?: () => void;
  onRecordPayment?: () => void;
};

function MoneyField({
  id,
  label,
  placeholder,
  currency,
  cents,
  onCentsChange,
}: {
  id: string;
  label: string;
  placeholder: string;
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
      placeholder={placeholder}
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
  paidAmountCents = 0,
  includesOpeningDebt = false,
  values,
  status,
  payFromOptions,
  currency = "BRL",
  saving = false,
  onChange,
  onClose,
  onResetToFull,
  onSave,
  onRecordPayment,
}: Props) {
  const m = useMessages();
  const isPaid = status === "paid";
  const isPartial = status === "partially_paid" || paidAmountCents > 0;
  const remainingCents = Math.max(0, computedTotalCents - paidAmountCents);
  const plannedCents = values.plannedPaymentCents ?? remainingCents;
  const hasOverride = values.plannedPaymentCents != null;
  const unpaidAfterThisPayment = Math.max(0, remainingCents - plannedCents);
  const periodLabel = formatStatementPeriod(periodStart, closingDate);
  const canRecord = !isPaid && plannedCents > 0 && remainingCents > 0 && Boolean(onRecordPayment);
  const canSave = !isPaid && Boolean(onSave);
  const paymentLabel = isPartial ? m.statements.thisPayment : m.common.form.plannedPayment;

  return (
    <EditorPanel
      open={open}
      labelId="statement-editor-title"
      title={m.statements.editor.title}
      subtitle={fmt(m.statements.editor.subtitle, { cardName, period: periodLabel })}
      onClose={onClose}
      footer={
        <EditorPanelFooterActions>
          <Button variant="ghost" type="button" onClick={onClose}>
            {m.common.cancel}
          </Button>
          {canSave && (
            <Button variant="ghost" type="button" disabled={saving} onClick={onSave}>
              {m.common.saveChanges}
            </Button>
          )}
          {onRecordPayment && (
            <Button
              variant="primary"
              type="button"
              disabled={saving || !canRecord}
              className={styles.recordButton}
              onClick={onRecordPayment}
            >
              {m.common.recordPayment}
            </Button>
          )}
        </EditorPanelFooterActions>
      }
    >
      <div className={styles.section}>
        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>{m.statements.computedTotal}</span>
          <MoneyAmount cents={computedTotalCents} />
          {includesOpeningDebt && (
            <p className={styles.readOnlyHint}>{m.statements.computedHint}</p>
          )}
        </div>

        {isPartial && !isPaid && (
          <>
            <div className={styles.readOnlyRow}>
              <span className={styles.readOnlyLabel}>{m.statements.alreadyPaid}</span>
              <MoneyAmount cents={paidAmountCents} />
            </div>
            <div className={styles.readOnlyRow}>
              <span className={styles.readOnlyLabel}>{m.statements.remaining}</span>
              <MoneyAmount cents={remainingCents} />
            </div>
          </>
        )}

        <div className={styles.readOnlyRow}>
          <span className={styles.readOnlyLabel}>{m.common.form.dueDate}</span>
          <FormattedDate isoDate={dueDate} />
          {isPaid && <Chip variant="actual">{m.common.paidCheck}</Chip>}
          {status === "partially_paid" && <Chip variant="statement">{m.common.partial}</Chip>}
        </div>

        {!isPaid && (
          <>
            <div className={styles.fieldRow}>
              <MoneyField
                id="statement-planned-payment"
                label={paymentLabel}
                placeholder={m.common.form.placeholderAmount}
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
                  {m.common.resetToFull}
                </Button>
              )}
            </div>

            {unpaidAfterThisPayment > 0 && (
              <p className={styles.readOnlyHint}>
                {fmt(m.statements.remainderHint, {
                  amount: formatCents(unpaidAfterThisPayment),
                })}
              </p>
            )}

            <FormField
              id="statement-pay-from"
              label={m.common.form.payFrom}
              inputType="select"
              value={values.payFromAccountId ?? ""}
              onChange={(event) => onChange({ payFromAccountId: event.target.value || undefined })}
            >
              <option value="">{m.common.defaultAccount}</option>
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
