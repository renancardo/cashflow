import type { ProjectionDay, ProjectionItem } from "@cashflow/core";
import { compareIso, parseIso } from "@cashflow/core";
import type { DayTemporalState } from "../molecules/CalendarDayCell/CalendarDayCell.js";
import type { IndicatorKind } from "../atoms/Indicator/Indicator.js";

export const YEAR_GRID_COLUMNS = 37;

export type CalendarCell = {
  date: string | null;
  day?: number;
};

export type EntryLineTone =
  | "actual-income"
  | "projected-income"
  | "actual-outflow"
  | "projected-outflow"
  | "past-due"
  | "awaiting-income";

export type DayEntryLine = {
  id: string;
  label: string;
  tone: EntryLineTone;
};

export const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export type MonthKey = (typeof MONTH_KEYS)[number];

export function repeatWeekdayLabels(
  labels: Record<WeekdayKey, string>,
  columns = YEAR_GRID_COLUMNS,
): string[] {
  return Array.from({ length: columns }, (_, index) => labels[WEEKDAY_KEYS[index % 7]]);
}

export function weekdayLongLabels(labels: Record<WeekdayKey, string>): string[] {
  return WEEKDAY_KEYS.map((key) => labels[key]);
}

export function monthShortLabels(labels: Record<MonthKey, string>): string[] {
  return MONTH_KEYS.map((key) => labels[key]);
}

export function buildYearMonthRow(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPrefix = String(month).padStart(2, "0");

  return Array.from({ length: YEAR_GRID_COLUMNS }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > daysInMonth) return { date: null };
    const dayPrefix = String(day).padStart(2, "0");
    return { date: `${year}-${monthPrefix}-${dayPrefix}`, day };
  });
}

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const monthPrefix = String(month).padStart(2, "0");
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ date: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayPrefix = String(day).padStart(2, "0");
    cells.push({ date: `${year}-${monthPrefix}-${dayPrefix}`, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null });
  }

  return cells;
}

export function getDayTemporalState(date: string, today: string): DayTemporalState {
  const comparison = compareIso(date, today);
  if (comparison < 0) return "past";
  if (comparison === 0) return "today";
  return "future";
}

export function getDayIndicators(day: ProjectionDay): IndicatorKind[] {
  const indicators: IndicatorKind[] = [];
  if (day.belowBuffer) indicators.push("danger");
  if (day.inflowsCents > 0) indicators.push("success");
  if (day.largeOutflow) indicators.push("warning");
  if (day.items.some((item) => item.source === "statement_payment")) indicators.push("card");
  return indicators;
}

export function getEntryLineTone(item: ProjectionItem): EntryLineTone {
  const isIncome = item.type === "income";

  if (item.isOverdue) {
    return isIncome ? "awaiting-income" : "past-due";
  }

  if (item.isProjected) {
    return isIncome ? "projected-income" : "projected-outflow";
  }

  return isIncome ? "actual-income" : "actual-outflow";
}

export function getDayEntryLines(day: ProjectionDay, _today: string, maxLines = 3): DayEntryLine[] {
  return day.items.slice(0, maxLines).map((item) => ({
    id: `${item.source}-${item.refId}`,
    label: item.description,
    tone: getEntryLineTone(item),
  }));
}

export function formatWeekdayLong(isoDate: string, locale = "en-US"): string {
  return parseIso(isoDate).toLocaleDateString(locale, { weekday: "long" });
}

export function formatMonthYear(isoMonth: string, locale = "en-US"): string {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(isoMonth: string, delta: number): string {
  const [year, month] = isoMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

export function daysUntil(fromIso: string, toIso: string): number {
  const from = parseIso(fromIso);
  const to = parseIso(toIso);
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export function isAlertActive(nextNegativeDate: string | null): boolean {
  return nextNegativeDate !== null;
}

export function isWeekend(isoDate: string): boolean {
  const weekday = parseIso(isoDate).getDay();
  return weekday === 0 || weekday === 6;
}

export function indexProjectionDays(days: ProjectionDay[]): Map<string, ProjectionDay> {
  return new Map(days.map((day) => [day.date, day]));
}
