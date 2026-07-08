import { useState } from "react";
import { addDays } from "@cashflow/core";
import { TimeTravelPanel } from "@cashflow/ui";
import { getDatabase } from "@cashflow/db";
import { useAppClock } from "./useAppClock";
import styles from "./TimeTravelDevTools.module.css";

function hasLedgerMutations(): boolean {
  const db = getDatabase();
  return (
    db.transactions.some((row) => row.id !== "tx-card-payment") ||
    db.plannedItemOverrides.length > 0 ||
    db.creditCardStatements.some((row) => row.status === "paid" && row.dueDate !== "2026-07-03")
  );
}

export function TimeTravelDevTools() {
  const { today, setToday, restoreSeed, setTodayError, isSimulated } = useAppClock();
  const [open, setOpen] = useState(false);

  const handleRestoreSeed = () => {
    const message = hasLedgerMutations()
      ? "Restore seed data and reset simulated date to 2026-06-28? This discards QA changes made in this session."
      : "Restore seed data and reset simulated date to 2026-06-28?";
    if (!window.confirm(message)) return;
    restoreSeed();
    setOpen(false);
  };

  return (
    <>
      {isSimulated ? (
        <div className={styles.badge} aria-live="polite">
          Simulated: {today}
        </div>
      ) : null}

      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls="time-travel-panel"
        onClick={() => setOpen((current) => !current)}
      >
        Dev tools
      </button>

      <TimeTravelPanel
        open={open}
        today={today}
        applyError={setTodayError}
        onClose={() => setOpen(false)}
        onApply={(iso) => {
          setToday(iso);
        }}
        onStepDays={(days) => {
          setToday(addDays(today, days));
        }}
        onRestoreSeed={handleRestoreSeed}
      />
    </>
  );
}
