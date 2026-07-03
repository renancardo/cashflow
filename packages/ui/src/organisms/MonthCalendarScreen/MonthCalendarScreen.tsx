import { useMemo } from "react";
import type { ProjectionDay } from "@cashflow/core";
import { formatMoney } from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { Indicator } from "../../atoms/Indicator/Indicator.js";
import { CalendarHeaderMetrics } from "../../molecules/CalendarHeaderMetrics/CalendarHeaderMetrics.js";
import { CalendarLegend } from "../../molecules/CalendarLegend/CalendarLegend.js";
import { SummaryStrip, SummaryStripItem } from "../../molecules/SummaryStrip/SummaryStrip.js";
import {
  buildMonthGrid,
  formatMonthYear,
  getDayEntryLines,
  getDayIndicators,
  indexProjectionDays,
  shiftMonth,
} from "../../lib/calendar.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import styles from "./MonthCalendarScreen.module.css";

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  month: string;
  days: ProjectionDay[];
  workingBalanceCents: number;
  nextNegativeDate: string | null;
  alertLeadTimeDays: number;
  today: string;
  selectedDate?: string | null;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  dayPanel?: React.ReactNode;
  onMonthChange?: (month: string) => void;
  onYearView?: () => void;
  onDaySelect?: (date: string) => void;
};

export function MonthCalendarScreen({
  month,
  days,
  workingBalanceCents,
  nextNegativeDate,
  alertLeadTimeDays,
  today,
  selectedDate,
  status = "ready",
  errorMessage,
  dayPanel,
  onMonthChange,
  onYearView,
  onDaySelect,
}: Props) {
  const [year, monthNum] = month.split("-").map(Number);
  const daysByDate = useMemo(() => indexProjectionDays(days), [days]);
  const cells = useMemo(() => buildMonthGrid(year, monthNum), [year, monthNum]);

  const monthDays = useMemo(
    () => days.filter((day) => day.date.startsWith(`${month}-`)),
    [days, month],
  );

  const totals = useMemo(() => {
    return monthDays.reduce(
      (acc, day) => ({
        inflows: acc.inflows + day.inflowsCents,
        outflows: acc.outflows + day.outflowsCents,
        belowBufferDays: acc.belowBufferDays + (day.belowBuffer ? 1 : 0),
      }),
      { inflows: 0, outflows: 0, belowBufferDays: 0 },
    );
  }, [monthDays]);

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
    onMonthChange?.(today.slice(0, 7));
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
            <Button variant="ghost" onClick={onYearView}>
              Year view
            </Button>
            <div className={styles.monthNav} role="group" aria-label="Month">
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label="Previous month"
                onClick={() => onMonthChange?.(shiftMonth(month, -1))}
              >
                ←
              </Button>
              <span className={styles.monthLabel}>{formatMonthYear(`${month}-01`)}</span>
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label="Next month"
                onClick={() => onMonthChange?.(shiftMonth(month, 1))}
              >
                →
              </Button>
            </div>
            <Button variant="ghost" onClick={jumpToToday}>
              Jump to today
            </Button>
          </div>
          <CalendarLegend variant="month" />
        </div>

        <SummaryStrip className={styles.summary}>
          <SummaryStripItem label="Projected inflows" tone="success">
            {formatMoney(totals.inflows)}
          </SummaryStripItem>
          <SummaryStripItem label="Projected outflows" tone="warning">
            {formatMoney(totals.outflows)}
          </SummaryStripItem>
          <SummaryStripItem
            label="Below buffer days"
            tone={totals.belowBufferDays > 0 ? "warning" : "default"}
          >
            {totals.belowBufferDays}
          </SummaryStripItem>
        </SummaryStrip>

        <div className={styles.calendar}>
          <div className={styles.weekdayHeader}>
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className={styles.weekdayCell}>
                {label}
              </div>
            ))}
          </div>

          <div className={styles.grid}>
            {cells.map((cell, index) => {
              if (!cell.date) {
                return <div key={`empty-${index}`} className={styles.emptyCell} />;
              }

              const day = daysByDate.get(cell.date);
              const indicators = day ? getDayIndicators(day) : [];
              const entries = day ? getDayEntryLines(day, today) : [];

              return (
                <button
                  key={cell.date}
                  type="button"
                  className={[
                    styles.dayCell,
                    day?.belowBuffer && styles.belowBuffer,
                    selectedDate === cell.date && styles.selected,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => onDaySelect?.(cell.date!)}
                >
                  <span className={styles.dayNumberContainer}>
                    <span className={styles.dayNumber}>{String(cell.day).padStart(2, "0")} - </span>
                    {day && (
                      <span
                        className={[styles.balance, day.belowBuffer && styles.balanceDanger]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {formatMoney(day.closingBalanceCents)}
                      </span>
                    )}
                  </span>
                  {entries.length > 0 && (
                    <span className={styles.entries}>
                      {entries.map((entry) => (
                        <span
                          key={entry.id}
                          className={[styles.entry, styles[entry.tone.replace(/-/g, "")]].join(" ")}
                        >
                          {entry.label}
                        </span>
                      ))}
                    </span>
                  )}
                  {indicators.length > 0 && (
                    <span className={styles.indicators}>
                      {indicators.map((kind, indicatorIndex) => (
                        <Indicator
                          key={`${kind}-${indicatorIndex}`}
                          kind={kind}
                          className={kind === "card" ? styles.indicatorCard : styles.indicatorDot}
                        />
                      ))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {dayPanel}
    </>
  );
}
