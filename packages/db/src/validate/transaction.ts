import type { Transaction } from "@cashflow/core";
import { accountsRepo } from "../repos/accounts.js";

export const TRANSFER_TO_CREDIT_CARD_ERROR =
  "Transfers to credit cards must use the statement payment flow.";

type TransferFields = Pick<Transaction, "type" | "toAccountId" | "paysStatementId">;

export async function assertValidTransaction(tx: TransferFields): Promise<void> {
  if (tx.type !== "transfer" || !tx.toAccountId || tx.paysStatementId) return;

  const destination = await accountsRepo.getById(tx.toAccountId);
  if (destination?.type === "credit_card") {
    throw new Error(TRANSFER_TO_CREDIT_CARD_ERROR);
  }
}
