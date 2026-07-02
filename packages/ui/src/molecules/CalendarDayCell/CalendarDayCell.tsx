import { Indicator, type IndicatorKind } from "../../atoms/Indicator/Indicator.js";
import styles from "./CalendarDayCell.module.css";

export type DayTemporalState = "past" | "today" | "future";

type Props = {
  day: number;
  state?: DayTemporalState;
  indicators?: IndicatorKind[];
  selected?: boolean;
  className?: string;
};

export function CalendarDayCell({
  day,
  state = "future",
  indicators = [],
  selected = false,
  className,
}: Props) {
  const paddedDay = String(day).padStart(2, "0");

  return (
    <div
      className={[styles.cell, styles[state], selected && styles.selected, className]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.dayNumber}>{paddedDay}</span>
      {indicators.length > 0 && (
        <div className={styles.indicators}>
          {indicators.map((kind, index) => (
            <Indicator key={`${kind}-${index}`} kind={kind} />
          ))}
        </div>
      )}
    </div>
  );
}
