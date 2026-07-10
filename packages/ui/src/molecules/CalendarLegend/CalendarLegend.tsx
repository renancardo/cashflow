import { Button } from "../../atoms/Button/Button.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./CalendarLegend.module.css";

type Props = {
  variant?: "year" | "month";
};

export function CalendarLegend({ variant = "year" }: Props) {
  const m = useMessages();
  const legend = m.calendar.legend;

  const indicatorItems = [
    { kind: "danger", label: legend.belowBuffer },
    { kind: "success", label: legend.incomeDay },
    { kind: "warning", label: legend.largeOutflow },
    { kind: "card", label: legend.cardDue },
  ] as const;

  const entryItems = [
    { kind: "actual-income", label: legend.actualIncome },
    { kind: "projected-income", label: legend.projectedIncome },
    { kind: "actual-outflow", label: legend.actualOutflow },
    { kind: "projected-outflow", label: legend.projectedOutflow },
    { kind: "past-due", label: legend.pastDue },
    { kind: "awaiting-income", label: legend.awaitingIncome },
  ] as const;

  return (
    <div className={styles.root}>
      <Button
        type="button"
        variant="ghost"
        className={styles.trigger}
        aria-label={m.calendar.aria.legend}
        aria-describedby="calendar-legend-tip"
      >
        <span className={styles.icon} aria-hidden>
          ?
        </span>
        {legend.trigger}
      </Button>
      <div
        className={[styles.panel, variant === "month" && styles.panelMonth]
          .filter(Boolean)
          .join(" ")}
        id="calendar-legend-tip"
        role="tooltip"
      >
        <p className={styles.title}>{legend.dayIndicators}</p>
        <ul className={styles.list}>
          {indicatorItems.map((item) => (
            <li key={item.kind}>
              <span className={[styles.marker, styles[item.kind]].join(" ")} aria-hidden />
              {item.label}
            </li>
          ))}
        </ul>

        {variant === "month" && (
          <>
            <p className={styles.sectionTitle}>{legend.entryColors}</p>
            <ul className={styles.list}>
              {entryItems.map((item) => (
                <li key={item.kind}>
                  <span className={[styles.marker, styles[item.kind]].join(" ")} aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
            <p className={styles.note}>{legend.monthTotalsNote}</p>
          </>
        )}
      </div>
    </div>
  );
}
