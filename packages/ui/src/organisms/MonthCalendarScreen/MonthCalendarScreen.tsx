import { useMemo } from "react";
import type { ProjectionDay } from "@cashflow/core";
import { fmt, formatDate, formatMoney } from "@cashflow/core";
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
  getDayTemporalState,
  hasOverdueItems,
  indexProjectionDays,
  isWeekend,
  shiftMonth,
  weekdayLongLabels,
  type EntryLineTone,
} from "../../lib/calendar.js";
import { useLanguage, useMessages } from "../../i18n/LanguageContext.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import styles from "./MonthCalendarScreen.module.css";

const entryToneStyles: Record<EntryLineTone, string> = {
  "actual-income": styles.actualincome,
  "projected-income": styles.projectedincome,
  "actual-outflow": styles.actualoutflow,
  "projected-outflow": styles.projectedoutflow,
  "past-due": styles.pastdue,
  "awaiting-income": styles.awaitingincome,
};

type Props = {
  month: string;
  days: ProjectionDay[];
  workingBalanceCents: number;
  nextNegativeDate: string | null;
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
  const language = useLanguage();
  const m = useMessages();
  const weekdayHeaders = useMemo(
    () => weekdayLongLabels(m.calendar.weekdays.long),
    [m.calendar.weekdays.long],
  );
  const monthLocale = language === "pt-BR" ? "pt-BR" : "en-US";

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
        <h2 className={styles.statusTitle}>{m.calendar.loading.title}</h2>
        <p>{m.calendar.loading.description}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.calendar.error.title}</h2>
        <p>{errorMessage ?? m.calendar.error.fallback}</p>
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
            today={today}
          />
        }
      />

      <div className={styles.page}>
        <div className={styles.toolbar}>
          <div className={styles.toolbarActions}>
            <Button variant="ghost" onClick={onYearView}>
              {m.calendar.yearView}
            </Button>
            <div className={styles.monthNav} role="group" aria-label={m.calendar.aria.monthNav}>
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label={m.calendar.aria.previousMonth}
                onClick={() => onMonthChange?.(shiftMonth(month, -1))}
              >
                ←
              </Button>
              <span className={styles.monthLabel}>
                {formatMonthYear(`${month}-01`, monthLocale)}
              </span>
              <Button
                variant="ghost"
                className={styles.iconButton}
                aria-label={m.calendar.aria.nextMonth}
                onClick={() => onMonthChange?.(shiftMonth(month, 1))}
              >
                →
              </Button>
            </div>
            <Button variant="ghost" onClick={jumpToToday}>
              {m.calendar.jumpToToday}
            </Button>
          </div>
          <CalendarLegend variant="month" />
        </div>

        <SummaryStrip className={styles.summary}>
          <SummaryStripItem label={m.calendar.summary.projectedInflows} tone="success">
            {formatMoney(totals.inflows)}
          </SummaryStripItem>
          <SummaryStripItem label={m.calendar.summary.projectedOutflows} tone="warning">
            {formatMoney(totals.outflows)}
          </SummaryStripItem>
          <SummaryStripItem
            label={m.calendar.summary.belowBufferDays}
            tone={totals.belowBufferDays > 0 ? "warning" : "default"}
          >
            {totals.belowBufferDays}
          </SummaryStripItem>
        </SummaryStrip>

        <div className={styles.calendar}>
          <div className={styles.weekdayHeader} aria-label={m.calendar.aria.weekdayHeader}>
            {weekdayHeaders.map((label) => (
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
              const temporal = getDayTemporalState(cell.date, today);
              const weekend = isWeekend(cell.date);
              const indicators = day ? getDayIndicators(day) : [];
              const entries = day ? getDayEntryLines(day, today) : [];

              return (
                <button
                  key={cell.date}
                  type="button"
                  className={[
                    styles.dayCell,
                    temporal !== "future" && styles[temporal],
                    weekend && styles.weekend,
                    day?.belowBuffer && styles.belowBuffer,
                    day && hasOverdueItems(day) && styles.overdue,
                    selectedDate === cell.date && styles.selected,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={fmt(m.calendar.aria.selectDay, {
                    date: formatDate(cell.date, language),
                  })}
                  onClick={() => onDaySelect?.(cell.date!)}
                >
                  <span>
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
                          className={[styles.entry, entryToneStyles[entry.tone]].join(" ")}
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
