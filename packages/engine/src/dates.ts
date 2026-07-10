/** Parse ISO date (YYYY-MM-DD) to local Date at midnight. */
export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Format Date to ISO date (YYYY-MM-DD). */
export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

export function minIso(...dates: string[]): string {
  return dates.reduce((min, date) => (compareIso(date, min) < 0 ? date : min));
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clamp day-of-month to the last valid day in the given month (1-based month). */
export function clampDayOfMonth(year: number, month: number, day: number): string {
  const clamped = Math.min(day, daysInMonth(year, month));
  return toIso(new Date(year, month - 1, clamped));
}

export function addMonths(iso: string, months: number): string {
  const date = parseIso(iso);
  date.setMonth(date.getMonth() + months);
  return toIso(date);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + days);
  return toIso(date);
}

export function addWeeks(iso: string, weeks: number): string {
  return addDays(iso, weeks * 7);
}

export function addYears(iso: string, years: number): string {
  return addMonths(iso, years * 12);
}

/** Inclusive horizon end date: asOfDate + horizonMonths. */
export function horizonEndDate(asOfDate: string, horizonMonths: number): string {
  return addMonths(asOfDate, horizonMonths);
}

export function eachDay(fromIso: string, toIsoDate: string): string[] {
  const days: string[] = [];
  for (let cursor = parseIso(fromIso); ; cursor.setDate(cursor.getDate() + 1)) {
    const iso = toIso(cursor);
    days.push(iso);
    if (iso >= toIsoDate) break;
  }
  return days;
}
