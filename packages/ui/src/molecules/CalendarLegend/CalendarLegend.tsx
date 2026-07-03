import { Button } from "../../atoms/Button/Button.js";
import styles from "./CalendarLegend.module.css";

type Props = {
  variant?: "year" | "month";
};

const INDICATOR_ITEMS = [
  { kind: "danger", label: "Below buffer — projected balance under your threshold" },
  { kind: "success", label: "Income day — net inflow on this date" },
  { kind: "warning", label: "Large outflow — net outflow above your limit" },
  { kind: "card", label: "Card statement due" },
] as const;

const ENTRY_ITEMS = [
  { kind: "actual-income", label: "Actual income" },
  { kind: "projected-income", label: "Projected income" },
  { kind: "actual-outflow", label: "Actual outflow" },
  { kind: "projected-outflow", label: "Projected outflow" },
  { kind: "past-due", label: "Past due payment" },
] as const;

export function CalendarLegend({ variant = "year" }: Props) {
  return (
    <div className={styles.root}>
      <Button
        type="button"
        variant="ghost"
        className={styles.trigger}
        aria-describedby="calendar-legend-tip"
      >
        <span className={styles.icon} aria-hidden>
          ?
        </span>
        Legend
      </Button>
      <div
        className={[styles.panel, variant === "month" && styles.panelMonth]
          .filter(Boolean)
          .join(" ")}
        id="calendar-legend-tip"
        role="tooltip"
      >
        <p className={styles.title}>Day indicators</p>
        <ul className={styles.list}>
          {INDICATOR_ITEMS.map((item) => (
            <li key={item.kind}>
              <span className={[styles.marker, styles[item.kind]].join(" ")} aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>

        {variant === "month" && (
          <>
            <p className={styles.sectionTitle}>Day entry colors</p>
            <ul className={styles.list}>
              {ENTRY_ITEMS.map((item) => (
                <li key={item.kind}>
                  <span className={[styles.marker, styles[item.kind]].join(" ")} aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
            <p className={styles.note}>
              Month totals reflect projected inflows and outflows for the selected month.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
