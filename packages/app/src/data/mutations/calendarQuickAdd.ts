import type { AccountType } from "@cashflow/core";
import type { Messages } from "@cashflow/core";
import { compareIso } from "@cashflow/core";
import { plannedItemsRepo, transactionsRepo } from "@cashflow/db";
import type { QuickAddValues } from "@cashflow/ui";
import { validateQuickAddTransfer } from "@cashflow/ui";
import { type PlannedItemEditorInput, toPlannedItemPayload } from "./usePlannedItemMutations";

type AccountOption = { id: string; name: string; type: AccountType };

export type QuickAddValidationError = keyof Messages["common"]["errors"];

export function quickAddValidationMessage(m: Messages, error: QuickAddValidationError): string {
  return m.common.errors[error];
}

export function validateCalendarQuickAdd(
  values: QuickAddValues,
  accountOptions: AccountOption[],
): QuickAddValidationError | undefined {
  if (validateQuickAddTransfer(values, accountOptions)) return "transferToCreditCard";
  if (values.amountCents <= 0) return "amountMustBePositive";
  if (!values.accountId) return "selectAccount";
  if (!values.effectiveDate) return "selectDate";
  if (values.type !== "transfer" && !values.categoryId) return "selectCategory";
  if (
    values.type === "transfer" &&
    (!values.toAccountId || values.toAccountId === values.accountId)
  ) {
    return "selectValidDestination";
  }
  return undefined;
}

export function quickAddToPlannedItemInput(
  values: QuickAddValues,
  defaultDescription = "Quick add",
): PlannedItemEditorInput {
  const isTransfer = values.type === "transfer";

  return {
    type: values.type,
    amountCents: values.amountCents,
    accountId: values.accountId,
    toAccountId: isTransfer ? values.toAccountId : undefined,
    categoryId: isTransfer ? undefined : values.categoryId,
    description: values.description.trim() || defaultDescription,
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
  defaultDescription = "Quick add",
): Promise<void> {
  const description = values.description.trim() || defaultDescription;

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
    toPlannedItemPayload(
      quickAddToPlannedItemInput({ ...values, description }, defaultDescription),
    ),
  );
}
