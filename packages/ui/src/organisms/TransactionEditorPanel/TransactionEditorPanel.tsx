import { useEffect, useState } from "react";
import type { TxType } from "@cashflow/core";
import { TX_TYPES, TX_TYPE_LABELS, formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import styles from "./TransactionEditorPanel.module.css";

export type TransactionEditorValues = {
  type: TxType;
  amountCents: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  description: string;
  effectiveDate: string;
};

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: TransactionEditorValues;
  currency?: string;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  onChange: (patch: Partial<TransactionEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

type MoneyFieldProps = {
  id: string;
  label: string;
  currency: string;
  cents: number;
  required?: boolean;
  onCentsChange: (cents: number) => void;
};

function MoneyField({ id, label, currency, cents, required, onCentsChange }: MoneyFieldProps) {
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

export function TransactionEditorPanel({
  open,
  mode,
  values,
  currency = "BRL",
  accountOptions,
  categoryOptions,
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
    values.effectiveDate.length > 0 &&
    (isTransfer
      ? Boolean(values.toAccountId && values.toAccountId !== values.accountId)
      : Boolean(values.categoryId));

  const subtitle =
    mode === "edit"
      ? `${values.description || "Transaction"} · ${values.effectiveDate}`
      : `New ${TX_TYPE_LABELS[values.type].toLowerCase()} transaction`;

  return (
    <EditorPanel
      open={open}
      labelId="transaction-editor-title"
      title={mode === "create" ? "Add transaction" : "Edit transaction"}
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
            <Button variant="primary" type="submit" disabled={!canSave} className={styles.saveButton}>
              {mode === "create" ? "Add transaction" : "Save changes"}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <div className={styles.typeGroup} role="group" aria-label="Transaction type">
        {TX_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={[styles.typeBtn, values.type === type && styles.typeBtnActive]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              onChange({
                type,
                categoryId: type === "transfer" ? undefined : values.categoryId,
                toAccountId: type === "transfer" ? values.toAccountId : undefined,
              })
            }
          >
            {TX_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <FormField
          id="txn-date"
          label="Date"
          type="date"
          value={values.effectiveDate}
          required
          onChange={(event) => onChange({ effectiveDate: event.target.value })}
        />
        <MoneyField
          id="txn-amount"
          label="Amount"
          currency={currency}
          cents={values.amountCents}
          required
          onCentsChange={(cents) => onChange({ amountCents: cents })}
        />
      </div>

      <FormField
        id="txn-description"
        label="Description"
        value={values.description}
        placeholder="What was this for?"
        required
        onChange={(event) => onChange({ description: event.target.value })}
      />

      {!isTransfer && (
        <FormField
          id="txn-category"
          label="Category"
          inputType="select"
          value={values.categoryId ?? ""}
          required
          onChange={(event) => onChange({ categoryId: event.target.value || undefined })}
        >
          <option value="">Select category</option>
          {filteredCategories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </FormField>
      )}

      <div className={styles.row}>
        <FormField
          id="txn-account"
          label={isTransfer ? "From account" : "Account"}
          inputType="select"
          value={values.accountId}
          required
          onChange={(event) => {
            const accountId = event.target.value;
            onChange({
              accountId,
              toAccountId:
                values.toAccountId === accountId ? undefined : values.toAccountId,
            });
          }}
        >
          <option value="">Select account</option>
          {accountOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </FormField>

        {isTransfer && (
          <FormField
            id="txn-to"
            label="To account"
            inputType="select"
            value={values.toAccountId ?? ""}
            required
            onChange={(event) => onChange({ toAccountId: event.target.value || undefined })}
          >
            <option value="">Select account</option>
            {toAccountOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FormField>
        )}
      </div>
    </EditorPanel>
  );
}
