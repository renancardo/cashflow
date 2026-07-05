import type { AccountType, TxType } from "@cashflow/core";

export const TRANSFER_TO_CREDIT_CARD_ERROR =
  "Transfers to credit cards must use the statement payment flow.";

type TransferValues = {
  type: TxType;
  toAccountId?: string;
};

type AccountOption = { id: string; type: AccountType };

export function validateTransferDestination(
  values: TransferValues,
  accountOptions: AccountOption[],
): string | undefined {
  if (values.type !== "transfer" || !values.toAccountId) return undefined;

  const destination = accountOptions.find((account) => account.id === values.toAccountId);
  if (destination?.type === "credit_card") {
    return TRANSFER_TO_CREDIT_CARD_ERROR;
  }

  return undefined;
}
