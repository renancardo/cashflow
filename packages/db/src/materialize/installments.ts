import type { Installment, InstallmentPlan } from "@cashflow/core";
import { getDatabase } from "../in-memory/database.js";
import { addMonths, clampDayOfMonth, parseIso } from "./dates.js";

export type InstallmentPlanInput = Omit<InstallmentPlan, "id" | "payoffDate" | "archivedAt">;

function dueDateForIndex(plan: InstallmentPlanInput, index: number): string {
  if (index === 1) return plan.firstDueDate;

  const firstParts = parseIso(plan.firstDueDate);
  const monthsAfterFirst = index - 1;
  const anchor = addMonths(
    `${firstParts.getFullYear()}-${String(firstParts.getMonth() + 1).padStart(2, "0")}-01`,
    monthsAfterFirst,
  );
  const anchorParts = parseIso(anchor);
  return clampDayOfMonth(anchorParts.getFullYear(), anchorParts.getMonth() + 1, plan.dayOfMonth);
}

function computePayoffDate(plan: InstallmentPlanInput): string {
  return dueDateForIndex(plan, plan.installmentCount);
}

/**
 * Eager-generate installment rows for a plan. Preserves paid rows and amount overrides.
 * Rejects count reduction below highest paid index.
 */
export function materializeInstallments(planId: string, plan: InstallmentPlanInput): Installment[] {
  const db = getDatabase();
  const existing = db.installments.filter((row) => row.installmentPlanId === planId);
  const paidRows = existing.filter((row) => row.status === "paid");
  const highestPaidIndex = paidRows.reduce((max, row) => Math.max(max, row.index), 0);

  if (plan.installmentCount < highestPaidIndex) {
    throw new Error(
      `Cannot reduce installment count below ${highestPaidIndex} (highest paid index)`,
    );
  }

  const preservedByIndex = new Map<number, Installment>();
  for (const row of existing) {
    if (row.status === "paid" || row.amountCentsOverride !== undefined) {
      preservedByIndex.set(row.index, row);
    }
  }

  const rows: Installment[] = [];
  for (let index = 1; index <= plan.installmentCount; index += 1) {
    const preserved = preservedByIndex.get(index);
    const dueDate = dueDateForIndex(plan, index);

    if (preserved) {
      rows.push({
        ...preserved,
        dueDate: preserved.status === "paid" ? preserved.dueDate : dueDate,
        installmentPlanId: planId,
        index,
      });
    } else {
      rows.push({
        id: crypto.randomUUID(),
        installmentPlanId: planId,
        index,
        dueDate,
        status: "scheduled",
      });
    }
  }

  db.installments = db.installments.filter((row) => row.installmentPlanId !== planId);
  db.installments.push(...rows);
  return rows;
}

export function payoffDateForPlan(plan: InstallmentPlanInput): string {
  return computePayoffDate(plan);
}
