import { useEffect, useMemo, useRef } from "react";
import type { ProjectionDay } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { CalendarDayCell } from "../../molecules/CalendarDayCell/CalendarDayCell.js";
import { CalendarHeaderMetrics } from "../../molecules/CalendarHeaderMetrics/CalendarHeaderMetrics.js";
import { CalendarLegend } from "../../molecules/CalendarLegend/CalendarLegend.js";
import {
  buildYearMonthRow,
  getDayIndicators,
  getDayTemporalState,
  indexProjectionDays,
  isWeekend,
  weekdayLabels,
} from "../../lib/calendar.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import styles from "./YearCalendarScreen.module.css";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Props = {
  year: number;
  days: ProjectionDay[];
  workingBalanceCents: number;
  nextNegativeDate: string | null;
  alertLeadTimeDays: number;
  today: string;
  selectedDate?: string | null;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  dayPanel?: React.ReactNode;
  onYearChange?: (year: number) => void;
  onMonthView?: () => void;
  onDaySelect?: (date: string) => void;
};

export function YearCalendarScreen({
  year,
  days,
  workingBalanceCents,
  nextNegativeDate,
  alertLeadTimeDays,
  today,
  selectedDate,
  status = "ready",
  errorMessage,
  dayPanel,
  onYearChange,
  onMonthView,
  onDaySelect,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const daysByDate = useMemo(() => indexProjectionDays(days), [days]);
  const weekdayBand = weekdayLabels();

  useEffect(() => {
    if (status !== "ready") return;
    const container = scrollRef.current;
    if (!container) return;

    const todayYear = Number(today.slice(0, 4));
    if (year !== todayYear) return;

    const month = Number(today.slice(5, 7));
    const row = container.querySelector(`[data-month-row="${month}"]`) as HTMLElement | null;
    const cell = container.querySelector(`[data-date="${today}"]`) as HTMLElement | null;
    if (row) row.scrollIntoView({ block: "nearest" });
    if (cell) cell.scrollIntoView({ inline: "center", block: "nearest" });
  }, [status, today, year]);

  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Loading calendar…</h2>
        <p>Fetching projection data.</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>Could not load calendar</h2>
        <p>{errorMessage ?? "Something went wrong. Try again."}</p>
      </div>
    );
  }

  const jumpToToday = () => {
    onYearChange?.(Number(today.slice(0, 4)));
    requestAnimationFrame(() => {
      const container = scrollRef.current;
      const cell = container?.querySelector(`[data-date="${today}"]`) as HTMLElement | null;
      cell?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    });
  };

  return (
    <>
      <HeaderStrip
        metric={
          <CalendarHeaderMetrics
            workingBalanceCents={workingBalanceCents}
            nextNegativeDate={nextNegativeDate}
            alertLeadTimeDays={alertLeadTimeDays}
            today={today}
          />
        }
      />

      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <Button variant="ghost" onClick={onMonthView}>
              Month view
            </Button>
            <div className={styles.yearNav} role="group" aria-label="Year">
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label="Previous year"
                onClick={() => onYearChange?.(year - 1)}
              >
                ←
              </Button>
              <span className={styles.yearLabel}>{year}</span>
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label="Next year"
                onClick={() => onYearChange?.(year + 1)}
              >
                →
              </Button>
            </div>
            <Button variant="ghost" onClick={jumpToToday}>
              Jump to today
            </Button>
          </div>
          <CalendarLegend variant="year" />
        </div>

        <div className={styles.scroll} ref={scrollRef}>
          <div className={styles.calendar}>
            <div className={styles.weekdayBand}>
              <div className={styles.corner} />
              {weekdayBand.map((label, index) => (
                <div key={`top-${label}-${index}`} className={styles.weekdayCell}>
                  {label}
                </div>
              ))}
            </div>

            {MONTH_LABELS.map((label, monthIndex) => {
              const month = monthIndex + 1;
              const cells = buildYearMonthRow(year, month);

              return (
                <div key={label} className={styles.monthRow} data-month-row={month}>
                  <div className={styles.monthLabel}>{label}</div>
                  <div className={styles.monthDays}>
                    {cells.map((cell, index) => {
                      if (!cell.date) {
                        return <div key={`${label}-empty-${index}`} className={styles.emptyCell} />;
                      }

                      const day = daysByDate.get(cell.date);
                      const temporal = getDayTemporalState(cell.date, today);
                      const indicators = day ? getDayIndicators(day) : [];

                      return (
                        <button
                          key={cell.date}
                          type="button"
                          className={styles.dayButton}
                          data-date={cell.date}
                          aria-label={cell.date}
                          onClick={() => onDaySelect?.(cell.date!)}
                        >
                          <CalendarDayCell
                            day={cell.day!}
                            state={temporal}
                            indicators={indicators}
                            selected={selectedDate === cell.date}
                            weekend={isWeekend(cell.date)}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className={[styles.weekdayBand, styles.weekdayBandBottom].join(" ")}>
              <div className={styles.corner} />
              {weekdayBand.map((label, index) => (
                <div key={`bottom-${label}-${index}`} className={styles.weekdayCell}>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {dayPanel}
    </>
  );
}
