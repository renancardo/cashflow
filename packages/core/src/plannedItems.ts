import type {
  Installment,
  InstallmentPlan,
  PlannedItem,
  PlannedItemOverride,
  Recurrence,
  Transaction,
  TxType,
} from "./entities.js";
import {
  addMonths,
  addWeeks,
  addDays,
  clampDayOfMonth,
  compareIso,
  dayBefore,
  horizonEndDate,
  parseIso,
} from "./dates.js";
import { formatDate } from "./format.js";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function plannedSettlementKey(plannedItemId: string, occurrenceDate: string): string {
  return `${plannedItemId}:${occurrenceDate}`;
}

export function buildPlannedSettlementSet(transactions: Transaction[]): Set<string> {
  const settled = new Set<string>();
  for (const tx of transactions) {
    if (tx.settlesPlannedItemId && tx.settlesPlannedOccurrenceDate) {
      settled.add(plannedSettlementKey(tx.settlesPlannedItemId, tx.settlesPlannedOccurrenceDate));
    }
  }
  return settled;
}

function overrideMap(overrides: PlannedItemOverride[]): Map<string, PlannedItemOverride> {
  const map = new Map<string, PlannedItemOverride>();
  for (const ovr of overrides) {
    map.set(plannedSettlementKey(ovr.plannedItemId, ovr.occurrenceDate), ovr);
  }
  return map;
}

function resolveOccurrence(
  item: PlannedItem,
  occurrenceDate: string,
  overrides: Map<string, PlannedItemOverride>,
): { date: string; amountCents: number } | null {
  const ovr = overrides.get(plannedSettlementKey(item.id, occurrenceDate));
  if (ovr?.status === "skipped") return null;

  return {
    date: ovr?.dateOverride ?? occurrenceDate,
    amountCents: ovr?.amountCentsOverride ?? item.amountCents,
  };
}

function expandMonthlyOccurrences(
  item: PlannedItem,
  horizonStart: string,
  horizonEnd: string,
): string[] {
  const day = item.dayOfMonth ?? parseIso(item.startDate).getDate();
  const dates: string[] = [];
  const startParts = parseIso(item.startDate);
  let year = startParts.getFullYear();
  let month = startParts.getMonth() + 1;
  const endBound = item.endDate && item.endDate < horizonEnd ? item.endDate : horizonEnd;

  while (true) {
    const occ = clampDayOfMonth(year, month, day);
    if (occ >= item.startDate && occ >= horizonStart) {
      dates.push(occ);
    }
    if (occ >= endBound) break;

    const next = addMonths(`${year}-${String(month).padStart(2, "0")}-01`, item.interval);
    const nextParts = parseIso(next);
    year = nextParts.getFullYear();
    month = nextParts.getMonth() + 1;

    const nextOcc = clampDayOfMonth(year, month, day);
    if (nextOcc > endBound) break;
    if (compareIso(nextOcc, occ) <= 0) break;
  }

  return dates;
}

function expandWeeklyOccurrences(
  item: PlannedItem,
  horizonStart: string,
  horizonEnd: string,
): string[] {
  const weekday = item.weekday ?? parseIso(item.startDate).getDay();
  const dates: string[] = [];
  const endBound = item.endDate && item.endDate < horizonEnd ? item.endDate : horizonEnd;

  let cursor = item.startDate;
  if (compareIso(cursor, horizonStart) < 0) cursor = horizonStart;

  while (parseIso(cursor).getDay() !== weekday) {
    cursor = addDays(cursor, 1);
    if (cursor > endBound) return dates;
  }

  while (cursor <= endBound) {
    if (cursor >= item.startDate && cursor >= horizonStart) {
      dates.push(cursor);
    }
    cursor = addWeeks(cursor, item.interval);
  }

  return dates;
}

function expandYearlyOccurrences(
  item: PlannedItem,
  horizonStart: string,
  horizonEnd: string,
): string[] {
  const month = item.monthOfYear ?? parseIso(item.startDate).getMonth() + 1;
  const day = item.dayOfMonth ?? parseIso(item.startDate).getDate();
  const dates: string[] = [];
  const endBound = item.endDate && item.endDate < horizonEnd ? item.endDate : horizonEnd;
  const startYear = parseIso(item.startDate).getFullYear();
  const endYear = parseIso(endBound).getFullYear();

  for (let year = startYear; year <= endYear; year += item.interval) {
    const occ = clampDayOfMonth(year, month, day);
    if (occ >= item.startDate && occ >= horizonStart && occ <= endBound) {
      dates.push(occ);
    }
  }

  return dates;
}

export function expandPlannedOccurrenceDates(
  item: PlannedItem,
  horizonStart: string,
  horizonEnd: string,
): string[] {
  switch (item.recurrence) {
    case "once":
      return item.startDate >= horizonStart &&
        item.startDate <= horizonEnd &&
        (!item.endDate || item.startDate <= item.endDate)
        ? [item.startDate]
        : [];
    case "monthly":
      return expandMonthlyOccurrences(item, horizonStart, horizonEnd);
    case "weekly":
      return expandWeeklyOccurrences(item, horizonStart, horizonEnd);
    case "yearly":
      return expandYearlyOccurrences(item, horizonStart, horizonEnd);
    default:
      return [];
  }
}

export function formatRecurrenceSummary(
  item: PlannedItem,
  language?: Parameters<typeof formatDate>[1],
): string {
  const intervalPrefix = item.interval > 1 ? `Every ${item.interval} ` : "";

  switch (item.recurrence) {
    case "once":
      return `Once · ${formatDate(item.startDate, language)}`;
    case "weekly": {
      const weekday = WEEKDAY_NAMES[item.weekday ?? parseIso(item.startDate).getDay()];
      return item.interval > 1 ? `${intervalPrefix}weeks · ${weekday}` : `Weekly · ${weekday}`;
    }
    case "monthly": {
      const day = item.dayOfMonth ?? parseIso(item.startDate).getDate();
      return item.interval > 1 ? `${intervalPrefix}months · day ${day}` : `Monthly · day ${day}`;
    }
    case "yearly": {
      const month = item.monthOfYear ?? parseIso(item.startDate).getMonth() + 1;
      const day = item.dayOfMonth ?? parseIso(item.startDate).getDate();
      const monthName = MONTH_NAMES[month - 1];
      return item.interval > 1
        ? `${intervalPrefix}years · ${monthName} ${day}`
        : `Yearly · ${monthName} ${day}`;
    }
    default:
      return item.recurrence;
  }
}

export function isRecurring(recurrence: Recurrence): boolean {
  return recurrence !== "once";
}

export function plannedItemGroup(recurrence: Recurrence): "recurring" | "oneOff" {
  return recurrence === "once" ? "oneOff" : "recurring";
}

export type PlannedOccurrence = {
  occurrenceDate: string;
  effectiveDate: string;
  amountCents: number;
};

export type ForecastScheduleOccurrence = PlannedOccurrence & {
  isSettled: boolean;
};

export function listPlannedOccurrences(
  item: PlannedItem,
  overrides: PlannedItemOverride[],
  settled: Set<string>,
  horizonStart: string,
  horizonEnd: string,
): PlannedOccurrence[] {
  if (!item.isActive || item.archivedAt) return [];

  const overrideLookup = overrideMap(overrides);
  const dates = expandPlannedOccurrenceDates(item, horizonStart, horizonEnd);
  const results: PlannedOccurrence[] = [];

  for (const occurrenceDate of dates) {
    if (settled.has(plannedSettlementKey(item.id, occurrenceDate))) continue;
    const resolved = resolveOccurrence(item, occurrenceDate, overrideLookup);
    if (!resolved) continue;
    results.push({
      occurrenceDate,
      effectiveDate: resolved.date,
      amountCents: resolved.amountCents,
    });
  }

  return results.sort((a, b) => compareIso(a.effectiveDate, b.effectiveDate));
}

export function nextPlannedOccurrence(
  item: PlannedItem,
  overrides: PlannedItemOverride[],
  settled: Set<string>,
  asOfDate: string,
  horizonMonths = 24,
): PlannedOccurrence | null {
  const horizonEnd = horizonEndDate(asOfDate, horizonMonths);
  const occurrences = listPlannedOccurrences(item, overrides, settled, asOfDate, horizonEnd);
  return occurrences[0] ?? null;
}

export function previewUpcomingOccurrences(
  item: PlannedItem,
  overrides: PlannedItemOverride[],
  settled: Set<string>,
  asOfDate: string,
  limit = 5,
  horizonMonths = 24,
): PlannedOccurrence[] {
  const horizonEnd = horizonEndDate(asOfDate, horizonMonths);
  return listPlannedOccurrences(item, overrides, settled, asOfDate, horizonEnd).slice(0, limit);
}

/**
 * Occurrences shown in the forecast schedule expander.
 * Includes settled one-off items so quick-add / mark-paid rows stay expandable.
 */
export function previewForecastSchedule(
  item: PlannedItem,
  overrides: PlannedItemOverride[],
  settled: Set<string>,
  asOfDate: string,
  limit = 5,
  horizonMonths = 24,
): ForecastScheduleOccurrence[] {
  const upcoming = previewUpcomingOccurrences(
    item,
    overrides,
    settled,
    asOfDate,
    limit,
    horizonMonths,
  ).map((occ) => ({ ...occ, isSettled: false }));

  if (upcoming.length > 0 || item.recurrence !== "once" || !item.isActive || item.archivedAt) {
    return upcoming;
  }

  const overrideLookup = overrideMap(overrides);
  const resolved = resolveOccurrence(item, item.startDate, overrideLookup);
  if (!resolved) return [];

  return [
    {
      occurrenceDate: item.startDate,
      effectiveDate: resolved.date,
      amountCents: resolved.amountCents,
      isSettled: settled.has(plannedSettlementKey(item.id, item.startDate)),
    },
  ];
}

export type ForecastSummaryMetrics = {
  activeItemCount: number;
  subscriptionCount: number;
  nextOutflow: { date: string; amountCents: number } | null;
  nextInflow: { date: string; amountCents: number } | null;
};

type CashflowCandidate = { date: string; amountCents: number; direction: TxType };

export function forecastSummaryMetrics(input: {
  plannedItems: PlannedItem[];
  installmentPlans: InstallmentPlan[];
  installments: Installment[];
  overrides: PlannedItemOverride[];
  settledPlanned: Set<string>;
  asOfDate: string;
  horizonMonths?: number;
}): ForecastSummaryMetrics {
  const horizonMonths = input.horizonMonths ?? 24;
  const horizonEnd = horizonEndDate(input.asOfDate, horizonMonths);

  const activePlanned = input.plannedItems.filter((p) => p.isActive && !p.archivedAt);
  const activePlans = input.installmentPlans.filter((p) => p.isActive && !p.archivedAt);

  const candidates: CashflowCandidate[] = [];

  for (const item of activePlanned) {
    const next = nextPlannedOccurrence(
      item,
      input.overrides,
      input.settledPlanned,
      input.asOfDate,
      horizonMonths,
    );
    if (!next) continue;
    candidates.push({
      date: next.effectiveDate,
      amountCents: next.amountCents,
      direction: item.type,
    });
  }

  for (const plan of activePlans) {
    const rows = input.installments
      .filter((row) => row.installmentPlanId === plan.id && row.status === "scheduled")
      .filter((row) => row.dueDate >= input.asOfDate && row.dueDate <= horizonEnd)
      .sort((a, b) => compareIso(a.dueDate, b.dueDate));
    const next = rows[0];
    if (!next) continue;
    candidates.push({
      date: next.dueDate,
      amountCents: next.amountCentsOverride ?? plan.installmentAmountCents,
      direction: "expense",
    });
  }

  const outflows = candidates
    .filter((c) => c.direction === "expense" || c.direction === "transfer")
    .sort((a, b) => compareIso(a.date, b.date));
  const inflows = candidates
    .filter((c) => c.direction === "income")
    .sort((a, b) => compareIso(a.date, b.date));

  return {
    activeItemCount: activePlanned.length + activePlans.length,
    subscriptionCount: activePlanned.filter((p) => p.isSubscription).length,
    nextOutflow: outflows[0]
      ? { date: outflows[0].date, amountCents: outflows[0].amountCents }
      : null,
    nextInflow: inflows[0] ? { date: inflows[0].date, amountCents: inflows[0].amountCents } : null,
  };
}

export { dayBefore };
