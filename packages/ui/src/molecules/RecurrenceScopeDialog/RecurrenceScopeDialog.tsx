import { useState } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { FormattedDate } from "../../atoms/FormattedDate/FormattedDate.js";
import styles from "./RecurrenceScopeDialog.module.css";

export type RecurrenceScope = "this" | "future";

type Props = {
  open: boolean;
  occurrenceDate: string;
  onConfirm: (scope: RecurrenceScope) => void;
  onCancel: () => void;
};

export function RecurrenceScopeDialog({ open, occurrenceDate, onConfirm, onCancel }: Props) {
  const [scope, setScope] = useState<RecurrenceScope>("this");

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation">
      <button type="button" className={styles.backdrop} aria-label="Cancel" onClick={onCancel} />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recurrence-scope-title"
      >
        <h3 className={styles.title} id="recurrence-scope-title">
          Apply changes to…
        </h3>
        <p className={styles.desc}>This item repeats. Choose how far the change should apply.</p>

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
              <span className={styles.optionTitle}>This occurrence only</span>
              <span className={styles.optionHint}>
                Creates an override for <FormattedDate isoDate={occurrenceDate} />
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
              <span className={styles.optionTitle}>This and future</span>
              <span className={styles.optionHint}>
                Ends the current rule before <FormattedDate isoDate={occurrenceDate} /> and starts a
                new one
              </span>
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onConfirm(scope)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
