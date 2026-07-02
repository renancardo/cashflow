import type { EngineInput, ProjectionDay, ProjectionResult } from "@cashflow/core";
import { todayIso } from "@cashflow/core";
import { aggregateWorkingBalanceAt, buildAccountMap } from "./accounts.js";
import { eachDay, horizonEndDate } from "./dates.js";
import {
  collectTransactionEventsByDate,
  installmentDayEvents,
  mergeEventMaps,
  plannedDayEvents,
  statementDayEvents,
} from "./events.js";
import { buildSettlementIndex } from "./settlements.js";

/**
 * Pure cash-flow projection engine.
 * Computes daily aggregate working balance from anchors, actuals, and forecast occurrences.
 */
export function projectCashFlow(
  input: EngineInput,
  asOfDate: string = todayIso(),
): ProjectionResult {
  const accountMap = buildAccountMap(input.accounts);
  const settlements = buildSettlementIndex(input);
  const horizonEnd = horizonEndDate(asOfDate, input.settings.horizonMonths);
  const dayDates = eachDay(asOfDate, horizonEnd);

  const txEvents = collectTransactionEventsByDate(
    input.transactions,
    accountMap,
    asOfDate,
    asOfDate,
    horizonEnd,
  );
  const plannedEvents = plannedDayEvents(
    input,
    accountMap,
    settlements,
    asOfDate,
    horizonEnd,
    asOfDate,
  );
  const installmentEvents = installmentDayEvents(
    input,
    accountMap,
    settlements,
    asOfDate,
    horizonEnd,
    asOfDate,
  );
  const statementEvents = statementDayEvents(
    input,
    accountMap,
    settlements,
    asOfDate,
    horizonEnd,
    asOfDate,
  );

  const eventsByDate = mergeEventMaps(txEvents, plannedEvents, installmentEvents, statementEvents);

  const buffer = input.settings.negativeBufferCents;
  const largeThreshold = input.settings.largeOutflowThresholdCents;

  let balance = aggregateWorkingBalanceAt(input.accounts, input.transactions, asOfDate);
  const days: ProjectionDay[] = [];

  for (const date of dayDates) {
    const openingBalanceCents = balance;
    let inflowsCents = 0;
    let outflowsCents = 0;
    const items = [];

    for (const event of eventsByDate.get(date) ?? []) {
      inflowsCents += event.effect.inflowCents;
      outflowsCents += event.effect.outflowCents;
      items.push(event.item);
    }

    const closingBalanceCents = openingBalanceCents + inflowsCents - outflowsCents;
    balance = closingBalanceCents;

    days.push({
      date,
      openingBalanceCents,
      inflowsCents,
      outflowsCents,
      closingBalanceCents,
      belowBuffer: closingBalanceCents < buffer,
      largeOutflow: largeThreshold > 0 && outflowsCents >= largeThreshold,
      items,
    });
  }

  const nextNegativeDate = days.find((d) => d.belowBuffer)?.date ?? null;
  const todayDay = days.find((d) => d.date === asOfDate);

  return {
    days,
    nextNegativeDate,
    workingBalanceTodayCents: todayDay?.closingBalanceCents ?? balance,
  };
}
