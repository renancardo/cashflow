import type { Installment, InstallmentPlan, Transaction } from "@cashflow/core";
import { installmentPlansRepo } from "../repos/installmentPlans.js";
import { installmentsRepo } from "../repos/installments.js";
import { transactionsRepo } from "../repos/transactions.js";

export type SettleInstallmentResult = {
  installment: Installment;
  transaction: Transaction;
};

/**
 * Records an installment as paid by creating a ledger transaction and linking it.
 * Uses today's date as the effective date so working balance updates immediately.
 */
export async function settleInstallment(
  installmentId: string,
  effectiveDate: string,
): Promise<SettleInstallmentResult> {
  const installment = await installmentsRepo.getById(installmentId);
  if (!installment) {
    throw new Error(`Installment not found: ${installmentId}`);
  }
  if (installment.status === "paid") {
    throw new Error(`Installment already paid: ${installmentId}`);
  }

  const plan = await installmentPlansRepo.getById(installment.installmentPlanId);
  if (!plan) {
    throw new Error(`InstallmentPlan not found: ${installment.installmentPlanId}`);
  }

  const amountCents = installment.amountCentsOverride ?? plan.installmentAmountCents;
  const transaction = await transactionsRepo.create({
    type: "expense",
    amountCents,
    accountId: plan.accountId,
    categoryId: plan.categoryId,
    description: formatInstallmentDescription(plan, installment),
    effectiveDate,
    settlesInstallmentId: installment.id,
  });

  const updated = await installmentsRepo.markPaid(installment.id, transaction.id);
  return { installment: updated, transaction };
}

function formatInstallmentDescription(plan: InstallmentPlan, installment: Installment): string {
  return `Parcela ${installment.index}/${plan.installmentCount} — ${plan.description}`;
}
