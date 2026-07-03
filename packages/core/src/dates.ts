/** ISO calendar date helpers shared by forecast display logic. */

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function compareIso(a: string, b: string): number {
  return a.localeCompare(b);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

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

export function dayBefore(iso: string): string {
  return addDays(iso, -1);
}

export function horizonEndDate(asOfDate: string, horizonMonths: number): string {
  return addMonths(asOfDate, horizonMonths);
}
