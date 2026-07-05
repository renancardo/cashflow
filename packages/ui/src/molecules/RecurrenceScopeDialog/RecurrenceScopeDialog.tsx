import { useState } from "react";
import { fmt, formatDisplayDate } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { useDateFormat, useLanguage, useMessages } from "../../i18n/LanguageContext.js";
import styles from "./RecurrenceScopeDialog.module.css";

export type RecurrenceScope = "this" | "future";

type Props = {
  open: boolean;
  occurrenceDate: string;
  onConfirm: (scope: RecurrenceScope) => void;
  onCancel: () => void;
};

export function RecurrenceScopeDialog({ open, occurrenceDate, onConfirm, onCancel }: Props) {
  const m = useMessages();
  const language = useLanguage();
  const dateFormat = useDateFormat();
  const [scope, setScope] = useState<RecurrenceScope>("this");

  const formattedDate = formatDisplayDate(occurrenceDate, language, dateFormat);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <button
        type="button"
        className={styles.backdrop}
        aria-label={m.common.aria.cancel}
        onClick={onCancel}
      />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurrence-scope-title"
      >
        <h3 className={styles.title} id="recurrence-scope-title">
          {m.recurrence.title}
        </h3>
        <p className={styles.desc}>{m.recurrence.desc}</p>

        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="recurrence-scope"
              value="this"
              checked={scope === "this"}
              onChange={() => setScope("this")}
            />
            <span className={styles.optionBody}>
              <span className={styles.optionTitle}>{m.recurrence.thisOnly.title}</span>
              <span className={styles.optionHint}>
                {fmt(m.recurrence.thisOnly.hint, { date: formattedDate })}
              </span>
            </span>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="recurrence-scope"
              value="future"
              checked={scope === "future"}
              onChange={() => setScope("future")}
            />
            <span className={styles.optionBody}>
              <span className={styles.optionTitle}>{m.recurrence.future.title}</span>
              <span className={styles.optionHint}>
                {fmt(m.recurrence.future.hint, { date: formattedDate })}
              </span>
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            {m.common.cancel}
          </Button>
          <Button variant="primary" onClick={() => onConfirm(scope)}>
            {m.common.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
