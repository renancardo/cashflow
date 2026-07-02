import type { EngineInput, ProjectionDay, ProjectionResult } from "@cashflow/core";
import { todayIso } from "@cashflow/core";

/**
 * Stub projection engine — US-1.x will replace with full logic.
 * Returns horizon days with flat working balance from account anchors.
 */
export function projectCashFlow(
  input: EngineInput,
  asOfDate: string = todayIso(),
): ProjectionResult {
  const workingBalance = sumWorkingBalances(input, asOfDate);
  const days = buildHorizonDays(input, asOfDate, workingBalance);

  const nextNegativeDate = days.find((d) => d.date >= asOfDate && d.belowBuffer)?.date ?? null;

  const todayDay = days.find((d) => d.date === asOfDate);

  return {
    days,
    nextNegativeDate,
    workingBalanceTodayCents: todayDay?.closingBalanceCents ?? workingBalance,
  };
}

function sumWorkingBalances(input: EngineInput, asOfDate: string): number {
  return input.accounts
    .filter((a) => a.isWorking && !a.archivedAt)
    .reduce((sum, account) => sum + balanceAtAnchor(account, asOfDate), 0);
}

function balanceAtAnchor(
  account: { anchorBalanceCents: number; anchorDate: string },
  _asOfDate: string,
): number {
  // Stub: use anchor only until US-1.2 applies transactions forward.
  return account.anchorBalanceCents;
}

function buildHorizonDays(
  input: EngineInput,
  asOfDate: string,
  balanceCents: number,
): ProjectionDay[] {
  const horizonMonths = input.settings.horizonMonths;
  const buffer = input.settings.negativeBufferCents;
  const largeThreshold = input.settings.largeOutflowThresholdCents;
  const start = parseIso(asOfDate);
  const end = addMonths(start, horizonMonths);
  const days: ProjectionDay[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = toIso(cursor);
    const belowBuffer = balanceCents < buffer;
    days.push({
      date,
      openingBalanceCents: balanceCents,
      inflowsCents: 0,
      outflowsCents: 0,
      closingBalanceCents: balanceCents,
      belowBuffer,
      largeOutflow: largeThreshold > 0 && 0 >= largeThreshold,
      items: [],
    });
  }

  return days;
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}
