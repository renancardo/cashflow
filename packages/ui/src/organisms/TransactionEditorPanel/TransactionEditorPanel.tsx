import { useEffect, useState } from "react";
import type { AccountType, TxType } from "@cashflow/core";
import { TX_TYPES, fmt, formatCents, parseMoney, txTypeLabel } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { EditorPanel, EditorPanelFooterActions } from "../EditorPanel/EditorPanel.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import { validateTransferDestination } from "../../lib/transferValidation.js";
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

type AccountOption = { id: string; name: string; type: AccountType };
type CategoryOption = { id: string; name: string; kind: "income" | "expense" };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  values: TransactionEditorValues;
  currency?: string;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  allowCreditCardDestination?: boolean;
  onChange: (patch: Partial<TransactionEditorValues>) => void;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
};

type MoneyFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  currency: string;
  cents: number;
  required?: boolean;
  onCentsChange: (cents: number) => void;
};

function MoneyField({
  id,
  label,
  placeholder,
  currency,
  cents,
  required,
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
  allowCreditCardDestination = false,
  onChange,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const m = useMessages();
  const isTransfer = values.type === "transfer";
  const filteredCategories = categoryOptions.filter((c) =>
    values.type === "income" ? c.kind === "income" : c.kind === "expense",
  );

  const toAccountOptions = accountOptions.filter((account) => {
    if (account.id === values.accountId) return false;
    if (account.type === "credit_card" && !allowCreditCardDestination) return false;
    return true;
  });

  const transferError =
    allowCreditCardDestination || !isTransfer
      ? undefined
      : validateTransferDestination(values, accountOptions);

  const canSave =
    values.description.trim().length > 0 &&
    values.amountCents > 0 &&
    values.accountId.length > 0 &&
    values.effectiveDate.length > 0 &&
    !transferError &&
    (isTransfer
      ? Boolean(values.toAccountId && values.toAccountId !== values.accountId)
      : Boolean(values.categoryId));

  const subtitle =
    mode === "edit"
      ? fmt(m.transactions.editTransactionSubtitle, {
          description: values.description || m.common.unknown,
          date: values.effectiveDate,
        })
      : fmt(m.transactions.newTransactionSubtitle, {
          type: txTypeLabel(m, values.type).toLowerCase(),
        });

  return (
    <EditorPanel
      open={open}
      labelId="transaction-editor-title"
      title={mode === "create" ? m.quickAdd.addTransaction : m.transactions.editTransaction}
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
            <Button
              variant="primary"
              type="submit"
              disabled={!canSave}
              className={styles.saveButton}
            >
              {mode === "create" ? m.quickAdd.addTransaction : m.common.saveChanges}
            </Button>
          </EditorPanelFooterActions>
        </>
      }
    >
      <div className={styles.typeGroup} role="group" aria-label={m.common.form.transactionType}>
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
            {txTypeLabel(m, type)}
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <FormField
          id="txn-date"
          label={m.common.form.date}
          type="date"
          value={values.effectiveDate}
          required
          onChange={(event) => onChange({ effectiveDate: event.target.value })}
        />
        <MoneyField
          id="txn-amount"
          label={m.common.form.amount}
          placeholder={m.common.form.placeholderAmount}
          currency={currency}
          cents={values.amountCents}
          required
          onCentsChange={(cents) => onChange({ amountCents: cents })}
        />
      </div>

      <FormField
        id="txn-description"
        label={m.common.form.description}
        value={values.description}
        placeholder={m.common.form.placeholderDescription}
        required
        onChange={(event) => onChange({ description: event.target.value })}
      />

      {!isTransfer && (
        <FormField
          id="txn-category"
          label={m.common.form.category}
          inputType="select"
          value={values.categoryId ?? ""}
          required
          onChange={(event) => onChange({ categoryId: event.target.value || undefined })}
        >
          <option value="">{m.common.form.selectCategory}</option>
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
          label={isTransfer ? m.common.form.fromAccount : m.common.form.account}
          inputType="select"
          value={values.accountId}
          required
          onChange={(event) => {
            const accountId = event.target.value;
            onChange({
              accountId,
              toAccountId: values.toAccountId === accountId ? undefined : values.toAccountId,
            });
          }}
        >
          <option value="">{m.common.form.selectAccount}</option>
          {accountOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </FormField>

        {isTransfer && (
          <FormField
            id="txn-to"
            label={m.common.form.toAccount}
            inputType="select"
            value={values.toAccountId ?? ""}
            required
            onChange={(event) => onChange({ toAccountId: event.target.value || undefined })}
          >
            <option value="">{m.common.form.selectAccount}</option>
            {toAccountOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </FormField>
        )}
      </div>

      {isTransfer && !allowCreditCardDestination && (
        <p className={styles.transferHint}>{m.transactions.transferHint}</p>
      )}

      {transferError && (
        <p className={styles.validationError}>{m.common.errors.transferToCreditCard}</p>
      )}
    </EditorPanel>
  );
}
