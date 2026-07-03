import { useEffect, useState } from "react";
import type { AccountType, TxType } from "@cashflow/core";
import { TX_TYPES, TX_TYPE_LABELS, formatCents, parseMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import { FormField } from "../../molecules/FormField/FormField.js";
import { SegmentedControl } from "../../molecules/SegmentedControl/SegmentedControl.js";
import styles from "./QuickAddCard.module.css";

export type QuickAddValues = {
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
  values: QuickAddValues;
  currency?: string;
  accountOptions: AccountOption[];
  categoryOptions: CategoryOption[];
  transferError?: string;
  saving?: boolean;
  onChange: (patch: Partial<QuickAddValues>) => void;
  onSubmit: () => void;
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

export function QuickAddCard({
  values,
  currency = "BRL",
  accountOptions,
  categoryOptions,
  transferError,
  saving = false,
  onChange,
  onSubmit,
}: Props) {
  const isTransfer = values.type === "transfer";
  const filteredCategories = categoryOptions.filter((category) =>
    values.type === "income" ? category.kind === "income" : category.kind === "expense",
  );
  const toAccountOptions = accountOptions.filter(
    (account) => account.id !== values.accountId && account.type !== "credit_card",
  );

  const canSubmit =
    values.amountCents > 0 &&
    values.accountId.length > 0 &&
    values.effectiveDate.length > 0 &&
    !transferError &&
    (isTransfer
      ? Boolean(values.toAccountId && values.toAccountId !== values.accountId)
      : Boolean(values.categoryId));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>Quick add</h3>
        <span className={styles.date}>
          <FormattedDate isoDate={values.effectiveDate} />
        </span>
      </div>

      <SegmentedControl
        aria-label="Transaction type"
        value={values.type}
        onChange={(type) =>
          onChange({
            type,
            categoryId: type === "transfer" ? undefined : values.categoryId,
            toAccountId: type === "transfer" ? values.toAccountId : undefined,
          })
        }
        options={TX_TYPES.map((type) => ({ value: type, label: TX_TYPE_LABELS[type] }))}
      />

      <div className={styles.row}>
        <MoneyField
          id="quick-add-amount"
          label="Amount"
          currency={currency}
          cents={values.amountCents}
          onCentsChange={(amountCents) => onChange({ amountCents })}
        />
        {!isTransfer ? (
          <FormField
            id="quick-add-category"
            label="Category"
            inputType="select"
            value={values.categoryId ?? ""}
            required
            onChange={(event) => onChange({ categoryId: event.target.value || undefined })}
          >
            <option value="">Select category</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </FormField>
        ) : (
          <FormField
            id="quick-add-to"
            label="To account"
            inputType="select"
            value={values.toAccountId ?? ""}
            required
            onChange={(event) => onChange({ toAccountId: event.target.value || undefined })}
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

      <div className={styles.row}>
        <FormField
          id="quick-add-account"
          label={isTransfer ? "From account" : "Account"}
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
          <option value="">Select account</option>
          {accountOptions.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </FormField>
        <FormField
          id="quick-add-description"
          label="Description"
          value={values.description}
          placeholder="Optional memo"
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>

      {transferError && <p className={styles.error}>{transferError}</p>}

      <Button
        variant="primary"
        type="button"
        className={styles.submit}
        disabled={!canSubmit || saving}
        onClick={onSubmit}
      >
        {saving ? "Adding…" : "Add transaction"}
      </Button>
    </div>
  );
}

export function validateQuickAddTransfer(
  values: QuickAddValues,
  accountOptions: AccountOption[],
): string | undefined {
  if (values.type !== "transfer" || !values.toAccountId) return undefined;
  const destination = accountOptions.find((account) => account.id === values.toAccountId);
  if (destination?.type === "credit_card") {
    return "Transfers to credit cards must use the statement payment flow.";
  }
  return undefined;
}
