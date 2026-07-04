import type { Account, CreditCardStatement, Transaction } from "@cashflow/core";
import {
  buildPlannedSettlementSet,
  compareIso,
  horizonEndDate,
  listPlannedOccurrences,
  todayIso,
} from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import { addMonths, clampDayOfMonth, parseIso, toIso } from "./dates.js";

type StatementCycle = {
  periodStart: string;
  closingDate: string;
  dueDate: string;
};

function monthStart(iso: string): string {
  const date = parseIso(iso);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** First due day after closing, using configured cycle days (see data-model §3.7). */
export function computeDueDate(closingDate: string, closingDay: number, dueDay: number): string {
  const closing = parseIso(closingDate);
  const year = closing.getFullYear();
  const month = closing.getMonth() + 1;

  if (dueDay > closingDay) {
    return clampDayOfMonth(year, month, dueDay);
  }

  const nextMonth = addMonths(monthStart(closingDate), 1);
  const next = parseIso(nextMonth);
  return clampDayOfMonth(next.getFullYear(), next.getMonth() + 1, dueDay);
}

export function generateStatementCycles(
  closingDay: number,
  dueDay: number,
  rangeStart: string,
  rangeEnd: string,
): StatementCycle[] {
  const closings: string[] = [];
  let cursor = monthStart(addMonths(rangeStart, -1));
  const endMonth = monthStart(addMonths(rangeEnd, 2));

  while (compareIso(cursor, endMonth) <= 0) {
    const parts = parseIso(cursor);
    closings.push(clampDayOfMonth(parts.getFullYear(), parts.getMonth() + 1, closingDay));
    cursor = addMonths(cursor, 1);
  }

  const cycles: StatementCycle[] = [];
  for (let index = 1; index < closings.length; index += 1) {
    const closingDate = closings[index]!;
    const previousClosing = closings[index - 1]!;
    const periodStart = dayAfter(previousClosing);
    const dueDate = computeDueDate(closingDate, closingDay, dueDay);

    if (compareIso(dueDate, rangeEnd) > 0) continue;
    if (compareIso(closingDate, addMonths(rangeStart, -12)) < 0) continue;

    cycles.push({
      periodStart,
      closingDate,
      dueDate,
    });
  }

  return cycles;
}

function dayAfter(iso: string): string {
  const date = parseIso(iso);
  date.setDate(date.getDate() + 1);
  return toIso(date);
}

function isPaidStatement(statement: CreditCardStatement): boolean {
  return statement.status === "paid" || Boolean(statement.paymentTransactionId);
}

function resolveStatementStatus(
  statement: CreditCardStatement,
  asOfDate: string,
): CreditCardStatement["status"] {
  if (isPaidStatement(statement)) return "paid";
  if (compareIso(statement.closingDate, asOfDate) < 0) return "closed";
  return "open";
}

function chargeFromTransaction(tx: Transaction, cardAccountId: string): number | null {
  if (tx.accountId === cardAccountId && tx.type === "expense") {
    return tx.amountCents;
  }
  return null;
}

function isInPeriod(date: string, periodStart: string, closingDate: string): boolean {
  return compareIso(date, periodStart) >= 0 && compareIso(date, closingDate) <= 0;
}

function findOpeningDebtStatement(
  statements: CreditCardStatement[],
  anchorDate: string,
): CreditCardStatement | undefined {
  return [...statements]
    .filter(
      (stmt) =>
        compareIso(stmt.dueDate, anchorDate) >= 0 &&
        compareIso(stmt.closingDate, anchorDate) >= 0,
    )
    .sort((a, b) => compareIso(a.dueDate, b.dueDate))[0];
}

function sumChargesInPeriod(
  card: Account,
  periodStart: string,
  closingDate: string,
  horizonEnd: string,
  afterDate?: string,
): number {
  const db = getDatabase();
  let total = 0;

  const includeDate = (date: string): boolean => {
    if (!isInPeriod(date, periodStart, closingDate)) return false;
    if (afterDate && compareIso(date, afterDate) <= 0) return false;
    return true;
  };

  for (const tx of db.transactions) {
    const charge = chargeFromTransaction(tx, card.id);
    if (charge !== null && includeDate(tx.effectiveDate)) {
      total += charge;
    }
  }

  const settled = buildPlannedSettlementSet(db.transactions);
  for (const item of db.plannedItems) {
    if (item.archivedAt || item.accountId !== card.id) continue;

    const occurrences = listPlannedOccurrences(
      item,
      db.plannedItemOverrides,
      settled,
      card.anchorDate,
      horizonEnd,
    );

    for (const occurrence of occurrences) {
      if (includeDate(occurrence.effectiveDate)) {
        total += occurrence.amountCents;
      }
    }
  }

  for (const installment of db.installments) {
    if (installment.status === "paid" || installment.settledTransactionId) continue;

    const plan = db.installmentPlans.find((row) => row.id === installment.installmentPlanId);
    if (!plan || plan.archivedAt || !plan.isActive || plan.accountId !== card.id) continue;
    if (!includeDate(installment.dueDate)) continue;

    total += installment.amountCentsOverride ?? plan.installmentAmountCents;
  }

  return total;
}

function computeStatementTotal(
  card: Account,
  statement: CreditCardStatement,
  openingDebtStatementId: string | undefined,
  horizonEnd: string,
): number {
  if (statement.id !== openingDebtStatementId || card.anchorBalanceCents <= 0) {
    return sumChargesInPeriod(card, statement.periodStart, statement.closingDate, horizonEnd);
  }

  return (
    card.anchorBalanceCents +
    sumChargesInPeriod(
      card,
      statement.periodStart,
      statement.closingDate,
      horizonEnd,
      card.anchorDate,
    )
  );
}

export function recomputeStatementTotalsForCard(
  cardAccountId: string,
  asOfDate: string = todayIso(),
): void {
  const db = getDatabase();
  const card = db.accounts.find((row) => row.id === cardAccountId && !row.archivedAt);
  if (!card || card.type !== "credit_card") return;

  const horizonEnd = horizonEndDate(asOfDate, db.settings.horizonMonths);
  const statements = db.creditCardStatements.filter((row) => row.cardAccountId === cardAccountId);
  const openingDebtStatement = findOpeningDebtStatement(statements, card.anchorDate);

  for (const statement of statements) {
    if (isPaidStatement(statement)) {
      statement.status = "paid";
      continue;
    }

    statement.computedTotalCents = computeStatementTotal(
      card,
      statement,
      openingDebtStatement?.id,
      horizonEnd,
    );
    statement.status = resolveStatementStatus(statement, asOfDate);
  }
}

export function recomputeAllStatementTotals(asOfDate: string = todayIso()): void {
  const db = getDatabase();
  for (const account of db.accounts) {
    if (account.type === "credit_card" && !account.archivedAt) {
      recomputeStatementTotalsForCard(account.id, asOfDate);
    }
  }
}

export function materializeStatementsForCard(
  cardAccountId: string,
  asOfDate: string = todayIso(),
): CreditCardStatement[] {
  const db = getDatabase();
  const card = db.accounts.find((row) => row.id === cardAccountId && !row.archivedAt);
  if (!card || card.type !== "credit_card" || !card.closingDay || !card.dueDay) {
    return [];
  }

  const horizonEnd = horizonEndDate(asOfDate, db.settings.horizonMonths);
  const rangeStart = addMonths(card.anchorDate, -12);
  const existing = db.creditCardStatements.filter((row) => row.cardAccountId === cardAccountId);
  const paidStatements = existing.filter(isPaidStatement);
  const preservedOverrides = new Map(
    existing
      .filter((row) => row.plannedPaymentCents != null || row.payFromAccountId != null)
      .map((row) => [row.closingDate, row]),
  );

  db.creditCardStatements = db.creditCardStatements.filter(
    (row) => row.cardAccountId !== cardAccountId || isPaidStatement(row),
  );

  const cycles = generateStatementCycles(card.closingDay, card.dueDay, rangeStart, horizonEnd);
  const paidClosingDates = new Set(paidStatements.map((row) => row.closingDate));

  for (const cycle of cycles) {
    if (paidClosingDates.has(cycle.closingDate)) continue;

    const preserved = preservedOverrides.get(cycle.closingDate);
    db.creditCardStatements.push({
      id: preserved?.id ?? crypto.randomUUID(),
      cardAccountId,
      periodStart: cycle.periodStart,
      closingDate: cycle.closingDate,
      dueDate: cycle.dueDate,
      computedTotalCents: 0,
      plannedPaymentCents: preserved?.plannedPaymentCents,
      payFromAccountId: preserved?.payFromAccountId ?? card.defaultPayFromAccountId,
      status: "open",
    });
  }

  recomputeStatementTotalsForCard(cardAccountId, asOfDate);
  return db.creditCardStatements.filter((row) => row.cardAccountId === cardAccountId);
}

export function materializeAllCreditCardStatements(asOfDate: string = todayIso()): void {
  const db = getDatabase();
  for (const account of db.accounts) {
    if (account.type === "credit_card" && !account.archivedAt) {
      materializeStatementsForCard(account.id, asOfDate);
    }
  }
}
