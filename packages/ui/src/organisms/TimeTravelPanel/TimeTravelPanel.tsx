import { useEffect, useState } from "react";
import { Button } from "../../atoms/Button/Button.js";
import styles from "./TimeTravelPanel.module.css";

/**
 * Stacking: z-index 110 — above main content, below editor overlays (120) and modals (200).
 */
type Props = {
  open: boolean;
  today: string;
  applyError?: string | null;
  onClose: () => void;
  onApply: (iso: string) => void;
  onStepDays: (days: number) => void;
  onRestoreSeed: () => void;
};

export function TimeTravelPanel({
  open,
  today,
  applyError,
  onClose,
  onApply,
  onStepDays,
  onRestoreSeed,
}: Props) {
  const [pickedDate, setPickedDate] = useState(today);

  useEffect(() => {
    if (open) {
      setPickedDate(today);
    }
  }, [open, today]);

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close dev tools"
        onClick={onClose}
      />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="time-travel-title"
      >
        <header className={styles.header}>
          <div>
            <h2 className={styles.title} id="time-travel-title">
              Time travel
            </h2>
            <p className={styles.subtitle}>Forward-only fast-forward for local QA</p>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Close dev tools"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.current}>
            Effective today: <strong>{today}</strong>
          </p>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="time-travel-date">
              Jump to date
            </label>
            <input
              id="time-travel-date"
              className={styles.dateInput}
              type="date"
              value={pickedDate}
              min={today}
              onChange={(event) => setPickedDate(event.target.value)}
            />
          </div>

          {applyError ? <p className={styles.error}>{applyError}</p> : null}

          <div className={styles.actions}>
            <Button variant="primary" onClick={() => onApply(pickedDate)}>
              Apply
            </Button>
            <Button variant="ghost" onClick={() => onStepDays(1)}>
              +1 day
            </Button>
            <Button variant="ghost" onClick={() => onStepDays(7)}>
              +7 days
            </Button>
          </div>

          <Button variant="ghost" className={styles.restore} onClick={onRestoreSeed}>
            Restore seed
          </Button>

          <p className={styles.hint}>
            Mutations persist while fast-forwarding. Use Restore seed to reload the bootstrap ledger
            and reset to the seed anchor date.
          </p>
        </div>
      </aside>
    </div>
  );
}
