import type { AccountType } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { ACCOUNT_TYPE_LABELS } from "../../lib/account-types.js";
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
};

type PayFromOption = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: AccountEditorValues;
  payFromOptions?: PayFromOption[];
  onChange: (patch: Partial<AccountEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onArchive?: () => void;
};

const ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "wallet",
  "credit_card",
  "investment",
];

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

function inputToCents(value: string): number {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

export function AccountEditorPanel({
  open,
  mode,
  values,
  payFromOptions = [],
  onChange,
  onClose,
  onSave,
  onArchive,
}: Props) {
  const isCreditCard = values.type === "credit_card";
  const workingLocked = isCreditCard || values.type === "investment";

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button type="button" className={styles.backdrop} aria-label="Close editor" onClick={onClose} />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="account-editor-title">
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title} id="account-editor-title">
                {mode === "create" ? "Add account" : "Edit account"}
              </h2>
              {mode === "edit" && (
                <p className={styles.subtitle}>
                  {values.name} · {ACCOUNT_TYPE_LABELS[values.type]}
                </p>
              )}
            </div>
            <button type="button" className={styles.close} aria-label="Close editor" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          <FormField
            id="account-name"
            label="Name"
            value={values.name}
            onChange={(event) => onChange({ name: event.target.value })}
            required
          />

          <div className={styles.row}>
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
            <FormField id="account-currency" label="Currency" value={values.currency} readOnly />
          </div>

          <div className={styles.toggleRow}>
            <div>
              <div className={styles.toggleLabel}>Working account</div>
              <div className={styles.toggleHint}>
                {workingLocked ? "Credit cards and investments are excluded by default" : "Include in working balance"}
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
            <div className={styles.row}>
              <FormField
                id="anchor-balance"
                label={isCreditCard ? "Amount owed" : "Opening balance"}
                type="number"
                step="0.01"
                min="0"
                value={centsToInput(values.anchorBalanceCents)}
                onChange={(event) => onChange({ anchorBalanceCents: inputToCents(event.target.value) })}
                required
              />
              <FormField
                id="anchor-date"
                label="Anchor date"
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
              <div className={styles.row}>
                <FormField
                  id="closing-day"
                  label="Closing day"
                  type="number"
                  min="1"
                  max="31"
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
                  value={values.dueDay ?? ""}
                  onChange={(event) =>
                    onChange({ dueDay: Number.parseInt(event.target.value, 10) || undefined })
                  }
                />
              </div>
              <FormField
                id="credit-limit"
                label="Credit limit"
                type="number"
                step="0.01"
                min="0"
                value={values.creditLimitCents != null ? centsToInput(values.creditLimitCents) : ""}
                onChange={(event) => onChange({ creditLimitCents: inputToCents(event.target.value) })}
              />
              <FormField
                id="pay-from"
                label="Default pay from"
                inputType="select"
                value={values.defaultPayFromAccountId ?? ""}
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
            <h3 className={styles.sectionTitle}>Optional metadata</h3>
            <FormField
              id="institution"
              label="Institution"
              value={values.institution ?? ""}
              onChange={(event) => onChange({ institution: event.target.value || undefined })}
            />
          </div>
        </div>

        <div className={styles.footer}>
          {mode === "edit" && onArchive && (
            <Button variant="ghost" onClick={onArchive}>
              Archive
            </Button>
          )}
          <Button variant="primary" onClick={onSave}>
            Save
          </Button>
        </div>
      </aside>
    </div>
  );
}
