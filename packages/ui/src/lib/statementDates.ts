/** DD/MM — compact date for statement tables. */
export function formatShortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

/** DD/MM/YY — closing date in period range. */
export function formatShortDateWithYear(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

export function formatStatementPeriod(periodStart: string, closingDate: string): string {
  return `${formatShortDate(periodStart)}–${formatShortDateWithYear(closingDate)}`;
}
