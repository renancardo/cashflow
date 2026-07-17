import { useEffect, useRef, useState } from "react";
import { formatCents, formatMoney, parseMoney } from "@cashflow/core";
import styles from "./InlineEditableAmount.module.css";

type Props = {
  cents: number;
  tone?: "income" | "danger" | "default";
  sign?: "+" | "−" | "";
  ariaLabel: string;
  disabled?: boolean;
  editKey: string;
  activeEditKey: string | null;
  onActiveEditKeyChange: (key: string | null) => void;
  onSave: (cents: number) => void;
  className?: string;
};

export function InlineEditableAmount({
  cents,
  tone = "default",
  sign = "",
  ariaLabel,
  disabled = false,
  editKey,
  activeEditKey,
  onActiveEditKeyChange,
  onSave,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => formatCents(cents));
  const [invalid, setInvalid] = useState(false);
  const isEditing = activeEditKey === editKey;

  useEffect(() => {
    if (!isEditing) {
      setDraft(formatCents(cents));
      setInvalid(false);
    }
  }, [cents, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    onActiveEditKeyChange(editKey);
    setDraft(formatCents(cents));
    setInvalid(false);
  };

  const finishEditing = (save: boolean) => {
    if (!isEditing) return;

    if (!save) {
      setDraft(formatCents(cents));
      setInvalid(false);
      onActiveEditKeyChange(null);
      return;
    }

    const parsed = parseMoney(draft);
    if (parsed === undefined || parsed <= 0) {
      setInvalid(true);
      inputRef.current?.focus();
      inputRef.current?.select();
      return;
    }

    if (parsed !== cents) {
      onSave(parsed);
    }

    setInvalid(false);
    onActiveEditKeyChange(null);
  };

  const rootClass = [
    styles[tone],
    isEditing ? styles.editing : styles.editable,
    invalid && styles.invalid,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isEditing) {
    return (
      <span className={rootClass}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          inputMode="decimal"
          aria-label={ariaLabel}
          aria-invalid={invalid}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              finishEditing(true);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              finishEditing(false);
            }
          }}
          onBlur={() => finishEditing(true)}
        />
      </span>
    );
  }

  return (
    <button
      type="button"
      className={rootClass}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={startEditing}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startEditing();
        }
      }}
    >
      {sign ? `${sign} ` : ""}
      {formatMoney(cents)}
    </button>
  );
}
