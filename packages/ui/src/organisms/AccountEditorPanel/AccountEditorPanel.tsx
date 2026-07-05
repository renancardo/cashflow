import { useEffect, useState } from "react";
import {
  ACCOUNT_TYPES,
  accountTypeLabel,
  fmt,
  formatCents,
  parseMoney,
  type AccountType,
} from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { Tooltip } from "../../atoms/Tooltip/Tooltip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./AccountEditorPanel.module.css";

export type AccountEditorValues = {
  name: string;
  type: AccountType;
  currency: string;
  isWorking: boolean;
  anchorBalanceCents: number;
  anchorDate: string;
  closingDay?: number;
  dueDay?: number;
  creditLimitCents?: number;
  defaultPayFromAccountId?: string;
  institution?: string;
  notes?: string;
};

type PayFromOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: AccountEditorValues;
  balanceCents?: number;
  payFromOptions?: PayFromOption[];
  onChange: (patch: Partial<AccountEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onArchive?: () => void;
};

type MoneyFieldProps = {
  id: string;
  label: string;
  currency: string;
  cents: number | undefined;
  placeholder: string;
  required?: boolean;
  hint?: string;
  onCentsChange: (cents: number | undefined) => void;
};

/**
 * Money input with a local draft so users can type freely ("12,5", "12.")
 * without the value being reformatted mid-keystroke. The draft is
 * normalized on blur and resynced when the value changes externally.
 */
function MoneyField({
  id,
  label,
  currency,
  cents,
  placeholder,
  required,
  hint,
  onCentsChange,
}: MoneyFieldProps) {
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

export function AccountEditorPanel({
  open,
  mode,
  values,
  balanceCents = 0,
  payFromOptions = [],
  onChange,
  onClose,
  onSave,
  onArchive,
}: Props) {
  const m = useMessages();
  const isCreditCard = values.type === "credit_card";
  const workingLocked = isCreditCard || values.type === "investment";
  const canSave = values.name.trim().length > 0;
  const canArchive = balanceCents === 0;
  const typeLabel = accountTypeLabel(m, values.type);

  const subtitle =
    mode === "edit"
      ? fmt(m.accounts.editAccountSubtitle, {
          name: values.name,
          type: typeLabel,
          currency: values.currency,
        })
      : fmt(m.accounts.newAccountSubtitle, {
          type: typeLabel.toLowerCase(),
          currency: values.currency,
        });

  return (
    <EditorPanel
      open={open}
      labelId="account-editor-title"
      title={mode === "create" ? m.accounts.editor.addTitle : m.accounts.editor.editTitle}
      subtitle={subtitle}
      onClose={onClose}
      onSubmit={() => {
        if (canSave) onSave();
      }}
      footer={
        <>
          {mode === "edit" && onArchive && (
            <Tooltip align="start" content={canArchive ? undefined : m.accounts.archiveTooltip}>
              <Button
                variant="ghost"
                className={styles.archiveButton}
                disabled={!canArchive}
                onClick={onArchive}
              >
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
              {mode === "create" ? m.accounts.editor.addSubmit : m.common.saveChanges}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <FormField
        id="account-name"
        label={m.common.form.name}
        value={values.name}
        placeholder={m.common.form.placeholderAccountName}
        onChange={(event) => onChange({ name: event.target.value })}
        required
      />

      <FormField
        id="account-type"
        label={m.common.form.type}
        inputType="select"
        value={values.type}
        onChange={(event) => onChange({ type: event.target.value as AccountType })}
      >
        {ACCOUNT_TYPES.map((type) => (
          <option key={type} value={type}>
            {accountTypeLabel(m, type)}
          </option>
        ))}
      </FormField>

      <div className={styles.toggleRow}>
        <div>
          <div className={styles.toggleLabel}>{m.accounts.working.on}</div>
          <div className={styles.toggleHint}>
            {workingLocked ? m.accounts.working.lockedHint : m.accounts.working.hint}
          </div>
        </div>
        <Toggle
          checked={values.isWorking}
          disabled={workingLocked}
          aria-label={m.accounts.working.on}
          onChange={(checked) => onChange({ isWorking: checked })}
        />
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{m.accounts.balanceAnchor.title}</h3>
        <p className={styles.sectionHint}>{m.accounts.balanceAnchor.hint}</p>
        <div className={styles.row}>
          <MoneyField
            id="anchor-balance"
            label={isCreditCard ? m.common.form.amountOwed : m.common.form.openingBalance}
            currency={values.currency}
            cents={values.anchorBalanceCents}
            placeholder={m.common.form.placeholderAmount}
            required
            onCentsChange={(cents) => onChange({ anchorBalanceCents: cents ?? 0 })}
          />
          <FormField
            id="anchor-date"
            label={m.common.form.asOfDate}
            type="date"
            value={values.anchorDate}
            onChange={(event) => onChange({ anchorDate: event.target.value })}
            required
          />
        </div>
      </div>

      {isCreditCard && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{m.accounts.creditCardCycle.title}</h3>
          <p className={styles.sectionHint}>{m.accounts.creditCardCycle.hint}</p>
          <div className={styles.row}>
            <FormField
              id="closing-day"
              label={m.common.form.closingDay}
              type="number"
              min="1"
              max="31"
              placeholder={m.common.form.placeholderClosingDay}
              value={values.closingDay ?? ""}
              onChange={(event) =>
                onChange({ closingDay: Number.parseInt(event.target.value, 10) || undefined })
              }
            />
            <FormField
              id="due-day"
              label={m.common.form.dueDay}
              type="number"
              min="1"
              max="31"
              placeholder={m.common.form.placeholderClosingDay}
              value={values.dueDay ?? ""}
              onChange={(event) =>
                onChange({ dueDay: Number.parseInt(event.target.value, 10) || undefined })
              }
            />
          </div>
          <MoneyField
            id="credit-limit"
            label={m.common.form.creditLimit}
            currency={values.currency}
            cents={values.creditLimitCents}
            placeholder={m.common.form.placeholderAmount}
            onCentsChange={(cents) => onChange({ creditLimitCents: cents })}
          />
          <FormField
            id="pay-from"
            label={m.common.form.payFromAccount}
            inputType="select"
            value={values.defaultPayFromAccountId ?? ""}
            onChange={(event) =>
              onChange({ defaultPayFromAccountId: event.target.value || undefined })
            }
          >
            <option value="">{m.common.form.selectAccount}</option>
            {payFromOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FormField>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{m.accounts.details.title}</h3>
        <FormField
          id="institution"
          label={m.common.form.institution}
          placeholder={m.common.form.placeholderInstitution}
          value={values.institution ?? ""}
          hint={m.common.optional}
          onChange={(event) => onChange({ institution: event.target.value || undefined })}
        />
        <FormField
          id="notes"
          label={m.common.form.notes}
          inputType="textarea"
          placeholder={m.common.form.placeholderNotes}
          value={values.notes ?? ""}
          hint={m.common.optional}
          onChange={(event) => onChange({ notes: event.target.value || undefined })}
        />
      </div>
    </EditorPanel>
  );
}
