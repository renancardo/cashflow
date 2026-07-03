import type { Installment, InstallmentPlan } from "./entities.js";
import { compareIso } from "./dates.js";

export type InstallmentPlanProgress = {
  paidCount: number;
  totalCount: number;
  remainingCount: number;
  progressPercent: number;
};

export function installmentPlanProgress(
  plan: InstallmentPlan,
  installments: Installment[],
): InstallmentPlanProgress {
  const rows = installments.filter((row) => row.installmentPlanId === plan.id);
  const paidCount = rows.filter((row) => row.status === "paid").length;
  const totalCount = plan.installmentCount;
  const remainingCount = totalCount - paidCount;
  const progressPercent = totalCount === 0 ? 0 : Math.round((paidCount / totalCount) * 100);

  return { paidCount, totalCount, remainingCount, progressPercent };
}

export type NextInstallmentDue = {
  installmentId: string;
  dueDate: string;
  amountCents: number;
  index: number;
};

export function nextUnpaidInstallment(
  plan: InstallmentPlan,
  installments: Installment[],
  asOfDate: string,
): NextInstallmentDue | null {
  const rows = installments
    .filter((row) => row.installmentPlanId === plan.id && row.status === "scheduled")
    .filter((row) => row.dueDate >= asOfDate)
    .sort((a, b) => compareIso(a.dueDate, b.dueDate));

  const next = rows[0];
  if (!next) return null;

  return {
    installmentId: next.id,
    dueDate: next.dueDate,
    amountCents: next.amountCentsOverride ?? plan.installmentAmountCents,
    index: next.index,
  };
}

export function installmentAmount(plan: InstallmentPlan, installment: Installment): number {
  return installment.amountCentsOverride ?? plan.installmentAmountCents;
}
