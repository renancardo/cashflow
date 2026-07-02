import { useEffect, useState } from "react";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  formatCents,
  parseMoney,
  type AccountType,
} from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { Tooltip } from "../../atoms/Tooltip/Tooltip.js";
import { FormField } from "../../molecules/FormField/FormField.js";
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
      placeholder="0.00"
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
  const isCreditCard = values.type === "credit_card";
  const workingLocked = isCreditCard || values.type === "investment";
  const canSave = values.name.trim().length > 0;
  const canArchive = balanceCents === 0;

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close editor"
        onClick={onClose}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-editor-title"
      >
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title} id="account-editor-title">
                {mode === "create" ? "Add account" : "Edit account"}
              </h2>
              <p className={styles.subtitle}>
                {mode === "edit"
                  ? `${values.name} · ${ACCOUNT_TYPE_LABELS[values.type]} · ${values.currency}`
                  : `New ${ACCOUNT_TYPE_LABELS[values.type].toLowerCase()} account · ${values.currency}`}
              </p>
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label="Close editor"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) onSave();
          }}
        >
          <div className={styles.body}>
            <FormField
              id="account-name"
              label="Name"
              value={values.name}
              placeholder="e.g. Nubank Checking"
              onChange={(event) => onChange({ name: event.target.value })}
              required
            />

            <FormField
              id="account-type"
              label="Type"
              inputType="select"
              value={values.type}
              onChange={(event) => onChange({ type: event.target.value as AccountType })}
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACCOUNT_TYPE_LABELS[type]}
                </option>
              ))}
            </FormField>

            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>Working account</div>
                <div className={styles.toggleHint}>
                  {workingLocked
                    ? "Credit cards and investments are excluded by default"
                    : "Include in working balance"}
                </div>
              </div>
              <Toggle
                checked={values.isWorking}
                disabled={workingLocked}
                aria-label="Working account"
                onChange={(checked) => onChange({ isWorking: checked })}
              />
            </div>

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Balance anchor</h3>
              <p className={styles.sectionHint}>
                Forecasts are projected forward from this known balance.
              </p>
              <div className={styles.row}>
                <MoneyField
                  id="anchor-balance"
                  label={isCreditCard ? "Amount owed" : "Opening balance"}
                  currency={values.currency}
                  cents={values.anchorBalanceCents}
                  required
                  onCentsChange={(cents) => onChange({ anchorBalanceCents: cents ?? 0 })}
                />
                <FormField
                  id="anchor-date"
                  label="As of date"
                  type="date"
                  value={values.anchorDate}
                  onChange={(event) => onChange({ anchorDate: event.target.value })}
                  required
                />
              </div>
            </div>

            {isCreditCard && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Credit card cycle</h3>
                <p className={styles.sectionHint}>
                  Used to schedule statement closing and payment due dates.
                </p>
                <div className={styles.row}>
                  <FormField
                    id="closing-day"
                    label="Closing day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1–31"
                    value={values.closingDay ?? ""}
                    onChange={(event) =>
                      onChange({ closingDay: Number.parseInt(event.target.value, 10) || undefined })
                    }
                  />
                  <FormField
                    id="due-day"
                    label="Due day"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1–31"
                    value={values.dueDay ?? ""}
                    onChange={(event) =>
                      onChange({ dueDay: Number.parseInt(event.target.value, 10) || undefined })
                    }
                  />
                </div>
                <MoneyField
                  id="credit-limit"
                  label="Credit limit"
                  currency={values.currency}
                  cents={values.creditLimitCents}
                  onCentsChange={(cents) => onChange({ creditLimitCents: cents })}
                />
                <FormField
                  id="pay-from"
                  label="Default pay from"
                  inputType="select"
                  value={values.defaultPayFromAccountId ?? ""}
                  hint="Account that pays this card's statement"
                  onChange={(event) =>
                    onChange({ defaultPayFromAccountId: event.target.value || undefined })
                  }
                >
                  <option value="">Select account</option>
                  {payFromOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </FormField>
              </div>
            )}

            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Details</h3>
              <FormField
                id="institution"
                label="Institution"
                placeholder="e.g. Nubank, Cora, Itaú"
                value={values.institution ?? ""}
                hint="Optional"
                onChange={(event) => onChange({ institution: event.target.value || undefined })}
              />
              <FormField
                id="notes"
                label="Notes"
                inputType="textarea"
                placeholder="Account number, branch, or anything else worth remembering"
                value={values.notes ?? ""}
                hint="Optional"
                onChange={(event) => onChange({ notes: event.target.value || undefined })}
              />
            </div>
          </div>

          <div className={styles.footer}>
            {mode === "edit" && onArchive && (
              <Tooltip
                align="start"
                content={
                  canArchive ? undefined : "Accounts can only be archived when the balance is zero."
                }
              >
                <Button
                  variant="ghost"
                  className={styles.archiveButton}
                  disabled={!canArchive}
                  onClick={onArchive}
                >
                  Archive
                </Button>
              </Tooltip>
            )}
            <div className={styles.footerActions}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!canSave}
                className={styles.saveButton}
              >
                {mode === "create" ? "Add account" : "Save changes"}
              </Button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
