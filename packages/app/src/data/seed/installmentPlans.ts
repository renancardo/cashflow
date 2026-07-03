import type { Installment, InstallmentPlan } from "@cashflow/core";

function clampDayOfMonth(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  const d = Math.min(day, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addMonthsIso(iso: string, months: number): string {
  const [y, m] = iso.split("-").map(Number);
  const date = new Date(y, m - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function dueDateForIndex(firstDueDate: string, dayOfMonth: number, index: number): string {
  if (index === 1) return firstDueDate;
  const anchor = addMonthsIso(firstDueDate, index - 1);
  const [y, m] = anchor.split("-").map(Number);
  return clampDayOfMonth(y, m, dayOfMonth);
}

function buildInstallments(
  planId: string,
  firstDueDate: string,
  dayOfMonth: number,
  count: number,
  paidThroughIndex: number,
): Installment[] {
  const rows: Installment[] = [];
  for (let index = 1; index <= count; index += 1) {
    rows.push({
      id: `${planId}-inst-${String(index).padStart(2, "0")}`,
      installmentPlanId: planId,
      index,
      dueDate: dueDateForIndex(firstDueDate, dayOfMonth, index),
      status: index <= paidThroughIndex ? "paid" : "scheduled",
      settledTransactionId: index <= paidThroughIndex ? `tx-settle-${planId}-${index}` : undefined,
    });
  }
  return rows;
}

export const SEED_INSTALLMENT_PLANS: InstallmentPlan[] = [
  {
    id: "plan-ipanema",
    description: "Ipanema",
    accountId: "acct-cora-checking",
    categoryId: "cat-debt",
    installmentAmountCents: 47_500,
    installmentCount: 36,
    firstDueDate: "2025-07-10",
    dayOfMonth: 10,
    payoffDate: dueDateForIndex("2025-07-10", 10, 36),
    isActive: true,
  },
  {
    id: "plan-maua",
    description: "Mauá — negativado",
    accountId: "acct-cora-checking",
    categoryId: "cat-debt",
    installmentAmountCents: 32_000,
    installmentCount: 24,
    firstDueDate: "2026-01-10",
    dayOfMonth: 10,
    payoffDate: dueDateForIndex("2026-01-10", 10, 24),
    isActive: false,
  },
];

export const SEED_INSTALLMENTS: Installment[] = [
  ...buildInstallments("plan-ipanema", "2025-07-10", 10, 36, 12),
  ...buildInstallments("plan-maua", "2026-01-10", 10, 24, 0),
];
