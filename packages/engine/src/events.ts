import type {
  Account,
  CreditCardStatement,
  EngineInput,
  Installment,
  InstallmentPlan,
  PlannedItem,
  PlannedItemOverride,
  ProjectionItem,
  Transaction,
} from "@cashflow/core";
import type { AccountMap } from "./accounts.js";
import { isWorkingAccount } from "./accounts.js";
import { addDays, addMonths, addWeeks, clampDayOfMonth, compareIso, parseIso } from "./dates.js";
import { plannedKey, type SettlementIndex } from "./settlements.js";

export interface WorkingEffect {
  inflowCents: number;
  outflowCents: number;
}

export interface DayEvent {
  item: ProjectionItem;
  effect: WorkingEffect;
}

function emptyEffect(): WorkingEffect {
  return { inflowCents: 0, outflowCents: 0 };
}

function effectFromAmount(amountCents: number, direction: "inflow" | "outflow"): WorkingEffect {
  return direction === "inflow"
    ? { inflowCents: amountCents, outflowCents: 0 }
    : { inflowCents: 0, outflowCents: amountCents };
}

function mergeEffects(a: WorkingEffect, b: WorkingEffect): WorkingEffect {
  return {
    inflowCents: a.inflowCents + b.inflowCents,
    outflowCents: a.outflowCents + b.outflowCents,
  };
}

function forecastTiming(
  effectiveDate: string,
  asOfDate: string,
): { isProjected: true; isOverdue: boolean } {
  return {
    isProjected: true,
    isOverdue: compareIso(effectiveDate, asOfDate) < 0,
  };
}

function applyForecastEffect(effect: WorkingEffect, isOverdue: boolean): WorkingEffect {
  return isOverdue ? emptyEffect() : effect;
}

function accountById(accountMap: AccountMap, accountId: string): Account | undefined {
  return accountMap.get(accountId);
}

/** Working-balance impact of an actual transaction. Credit-card purchases are excluded. */
export function transactionDayEvent(
  tx: Transaction,
  accountMap: AccountMap,
  asOfDate: string,
): DayEvent | null {
  const isProjected = compareIso(tx.effectiveDate, asOfDate) > 0;
  const sourceAccount = accountById(accountMap, tx.accountId);

  if (tx.type === "income") {
    if (!isWorkingAccount(sourceAccount)) return null;
    return {
      item: {
        source: "transaction",
        refId: tx.id,
        type: tx.type,
        amountCents: tx.amountCents,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        description: tx.description,
        isProjected,
        isOverdue: false,
      },
      effect: effectFromAmount(tx.amountCents, "inflow"),
    };
  }

  if (tx.type === "expense") {
    if (sourceAccount?.type === "credit_card") return null;
    if (!isWorkingAccount(sourceAccount)) return null;
    return {
      item: {
        source: "transaction",
        refId: tx.id,
        type: tx.type,
        amountCents: tx.amountCents,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        description: tx.description,
        isProjected,
        isOverdue: false,
      },
      effect: effectFromAmount(tx.amountCents, "outflow"),
    };
  }

  if (tx.type === "transfer") {
    const destAccount = tx.toAccountId ? accountById(accountMap, tx.toAccountId) : undefined;
    const sourceWorking = isWorkingAccount(sourceAccount);
    const destWorking = isWorkingAccount(destAccount);

    if (!sourceWorking && !destWorking) return null;

    let effect = emptyEffect();
    if (sourceWorking) effect = mergeEffects(effect, effectFromAmount(tx.amountCents, "outflow"));
    if (destWorking) effect = mergeEffects(effect, effectFromAmount(tx.amountCents, "inflow"));

    return {
      item: {
        source: "transaction",
        refId: tx.id,
        type: tx.type,
        amountCents: tx.amountCents,
        accountId: tx.accountId,
        categoryId: tx.categoryId,
        description: tx.description,
        isProjected,
        isOverdue: false,
      },
      effect,
    };
  }

  return null;
}

function overrideMap(overrides: PlannedItemOverride[]): Map<string, PlannedItemOverride> {
  const map = new Map<string, PlannedItemOverride>();
  for (const ovr of overrides) {
    map.set(plannedKey(ovr.plannedItemId, ovr.occurrenceDate), ovr);
  }
  return map;
}

function resolveOccurrence(
  item: PlannedItem,
  occurrenceDate: string,
  overrides: Map<string, PlannedItemOverride>,
): { date: string; amountCents: number; skipped: boolean } | null {
  const ovr = overrides.get(plannedKey(item.id, occurrenceDate));
  if (ovr?.status === "skipped") return null;

  const date = ovr?.dateOverride ?? occurrenceDate;
  const amountCents = ovr?.amountCentsOverride ?? item.amountCents;
  return { date, amountCents, skipped: false };
}

function plannedWorkingEffect(
  item: PlannedItem,
  amountCents: number,
  accountMap: AccountMap,
): WorkingEffect | null {
  const sourceAccount = accountById(accountMap, item.accountId);

  if (item.type === "income") {
    if (!isWorkingAccount(sourceAccount)) return null;
    return effectFromAmount(amountCents, "inflow");
  }

  if (item.type === "expense") {
    if (sourceAccount?.type === "credit_card") return null;
    if (!isWorkingAccount(sourceAccount)) return null;
    return effectFromAmount(amountCents, "outflow");
  }

  if (item.type === "transfer") {
    const destAccount = item.toAccountId ? accountById(accountMap, item.toAccountId) : undefined;
    let effect = emptyEffect();
    if (isWorkingAccount(sourceAccount)) {
      effect = mergeEffects(effect, effectFromAmount(amountCents, "outflow"));
    }
    if (isWorkingAccount(destAccount)) {
      effect = mergeEffects(effect, effectFromAmount(amountCents, "inflow"));
    }
    if (effect.inflowCents === 0 && effect.outflowCents === 0) return null;
    return effect;
  }

  return null;
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

function expandPlannedOccurrenceDates(
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

export function plannedDayEvents(
  input: EngineInput,
  accountMap: AccountMap,
  settlements: SettlementIndex,
  horizonStart: string,
  horizonEnd: string,
  asOfDate: string,
): Map<string, DayEvent[]> {
  const overrides = overrideMap(input.plannedItemOverrides);
  const byDate = new Map<string, DayEvent[]>();

  for (const item of input.plannedItems) {
    if (!item.isActive || item.archivedAt) continue;

    const occurrenceDates = expandPlannedOccurrenceDates(item, horizonStart, horizonEnd);
    for (const occurrenceDate of occurrenceDates) {
      if (settlements.planned.has(plannedKey(item.id, occurrenceDate))) continue;

      const resolved = resolveOccurrence(item, occurrenceDate, overrides);
      if (!resolved) continue;

      const effect = plannedWorkingEffect(item, resolved.amountCents, accountMap);
      if (!effect) continue;

      const timing = forecastTiming(resolved.date, asOfDate);
      const event: DayEvent = {
        item: {
          source: "planned",
          refId: item.id,
          type: item.type,
          amountCents: resolved.amountCents,
          accountId: item.accountId,
          categoryId: item.categoryId,
          description: item.description,
          occurrenceDate,
          ...timing,
        },
        effect: applyForecastEffect(effect, timing.isOverdue),
      };

      const list = byDate.get(resolved.date) ?? [];
      list.push(event);
      byDate.set(resolved.date, list);
    }
  }

  return byDate;
}

export function installmentDayEvents(
  input: EngineInput,
  accountMap: AccountMap,
  settlements: SettlementIndex,
  horizonStart: string,
  horizonEnd: string,
  asOfDate: string,
): Map<string, DayEvent[]> {
  const planMap = new Map<string, InstallmentPlan>(input.installmentPlans.map((p) => [p.id, p]));
  const byDate = new Map<string, DayEvent[]>();

  for (const inst of input.installments) {
    if (inst.status === "paid" || settlements.installments.has(inst.id)) continue;
    if (inst.dueDate < horizonStart || inst.dueDate > horizonEnd) continue;

    const plan = planMap.get(inst.installmentPlanId);
    if (!plan || !plan.isActive || plan.archivedAt) continue;

    const payAccount = accountById(accountMap, plan.accountId);
    if (!isWorkingAccount(payAccount)) continue;

    const amountCents = inst.amountCentsOverride ?? plan.installmentAmountCents;
    const timing = forecastTiming(inst.dueDate, asOfDate);
    const event: DayEvent = {
      item: {
        source: "installment",
        refId: inst.id,
        type: "expense",
        amountCents,
        accountId: plan.accountId,
        categoryId: plan.categoryId,
        description: plan.description,
        ...timing,
      },
      effect: applyForecastEffect(effectFromAmount(amountCents, "outflow"), timing.isOverdue),
    };

    const list = byDate.get(inst.dueDate) ?? [];
    list.push(event);
    byDate.set(inst.dueDate, list);
  }

  return byDate;
}

export function statementDayEvents(
  input: EngineInput,
  accountMap: AccountMap,
  settlements: SettlementIndex,
  horizonStart: string,
  horizonEnd: string,
  asOfDate: string,
): Map<string, DayEvent[]> {
  const byDate = new Map<string, DayEvent[]>();

  for (const stmt of input.creditCardStatements) {
    if (settlements.statements.has(stmt.id)) continue;
    if (stmt.dueDate < horizonStart || stmt.dueDate > horizonEnd) continue;

    const card = accountById(accountMap, stmt.cardAccountId);
    const payFromId = stmt.payFromAccountId ?? card?.defaultPayFromAccountId;
    if (!payFromId) continue;

    const payFrom = accountById(accountMap, payFromId);
    if (!isWorkingAccount(payFrom)) continue;

    const amountCents = stmt.plannedPaymentCents ?? stmt.computedTotalCents;
    if (amountCents <= 0) continue;

    const timing = forecastTiming(stmt.dueDate, asOfDate);
    const event: DayEvent = {
      item: {
        source: "statement_payment",
        refId: stmt.id,
        type: "expense",
        amountCents,
        accountId: payFromId,
        description: `Credit card statement payment`,
        ...timing,
      },
      effect: applyForecastEffect(effectFromAmount(amountCents, "outflow"), timing.isOverdue),
    };

    const list = byDate.get(stmt.dueDate) ?? [];
    list.push(event);
    byDate.set(stmt.dueDate, list);
  }

  return byDate;
}

export function collectTransactionEventsByDate(
  transactions: Transaction[],
  accountMap: AccountMap,
  asOfDate: string,
  horizonStart: string,
  horizonEnd: string,
): Map<string, DayEvent[]> {
  const byDate = new Map<string, DayEvent[]>();

  for (const tx of transactions) {
    if (tx.effectiveDate < horizonStart || tx.effectiveDate > horizonEnd) continue;
    const event = transactionDayEvent(tx, accountMap, asOfDate);
    if (!event) continue;
    const list = byDate.get(tx.effectiveDate) ?? [];
    list.push(event);
    byDate.set(tx.effectiveDate, list);
  }

  return byDate;
}

export function mergeEventMaps(...maps: Map<string, DayEvent[]>[]): Map<string, DayEvent[]> {
  const merged = new Map<string, DayEvent[]>();
  for (const map of maps) {
    for (const [date, events] of map) {
      const list = merged.get(date) ?? [];
      list.push(...events);
      merged.set(date, list);
    }
  }
  return merged;
}

export type { CreditCardStatement, Installment, InstallmentPlan, PlannedItem };
