import type { AccountType } from "@cashflow/core";
import { compareIso } from "@cashflow/core";
import { plannedItemsRepo, transactionsRepo } from "@cashflow/db";
import type { QuickAddValues } from "@cashflow/ui";
import { validateQuickAddTransfer } from "@cashflow/ui";
import {
  type PlannedItemEditorInput,
  toPlannedItemPayload,
} from "./usePlannedItemMutations";

type AccountOption = { id: string; name: string; type: AccountType };

export function validateCalendarQuickAdd(
  values: QuickAddValues,
  accountOptions: AccountOption[],
): string | undefined {
  const transferError = validateQuickAddTransfer(values, accountOptions);
  if (transferError) return transferError;
  if (values.amountCents <= 0) return "Amount must be greater than zero.";
  if (!values.accountId) return "Select an account.";
  if (!values.effectiveDate) return "Select a date.";
  if (values.type !== "transfer" && !values.categoryId) return "Select a category.";
  if (
    values.type === "transfer" &&
    (!values.toAccountId || values.toAccountId === values.accountId)
  ) {
    return "Select a valid destination account.";
  }
  return undefined;
}

export function quickAddToPlannedItemInput(values: QuickAddValues): PlannedItemEditorInput {
  const isTransfer = values.type === "transfer";

  return {
    type: values.type,
    amountCents: values.amountCents,
    accountId: values.accountId,
    toAccountId: isTransfer ? values.toAccountId : undefined,
    categoryId: isTransfer ? undefined : values.categoryId,
    description: values.description.trim() || "Quick add",
    recurrence: "once",
    interval: 1,
    startDate: values.effectiveDate,
    isSubscription: false,
    isActive: true,
  };
}

/** Future quick-add dates become forecast-only; today/past become ledger transactions. */
export function shouldRecordQuickAddAsTransaction(
  effectiveDate: string,
  asOfDate: string,
): boolean {
  return compareIso(effectiveDate, asOfDate) <= 0;
}

/** Future dates → one-off planned item. Today/past → transaction only. */
export async function submitCalendarQuickAdd(
  values: QuickAddValues,
  asOfDate: string,
): Promise<void> {
  const description = values.description.trim() || "Quick add";

  if (shouldRecordQuickAddAsTransaction(values.effectiveDate, asOfDate)) {
    const isTransfer = values.type === "transfer";
    await transactionsRepo.create({
      type: values.type,
      amountCents: Math.abs(values.amountCents),
      accountId: values.accountId,
      toAccountId: isTransfer ? values.toAccountId : undefined,
      categoryId: isTransfer ? undefined : values.categoryId,
      description,
      effectiveDate: values.effectiveDate,
    });
    return;
  }

  await plannedItemsRepo.create(
    toPlannedItemPayload(quickAddToPlannedItemInput({ ...values, description })),
  );
}
