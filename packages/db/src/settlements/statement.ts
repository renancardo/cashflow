import type { CreditCardStatement, Transaction } from "@cashflow/core";
import { accountsRepo } from "../repos/accounts.js";
import { creditCardStatementsRepo } from "../repos/creditCardStatements.js";
import { transactionsRepo } from "../repos/transactions.js";

export type SettleStatementResult = {
  statement: CreditCardStatement;
  transaction: Transaction;
};

/**
 * Records a credit card statement payment as a transfer from the working account to the card.
 */
export async function settleStatement(
  statementId: string,
  effectiveDate: string,
): Promise<SettleStatementResult> {
  const statement = await creditCardStatementsRepo.getById(statementId);
  if (!statement) {
    throw new Error(`CreditCardStatement not found: ${statementId}`);
  }
  if (statement.status === "paid" || statement.paymentTransactionId) {
    throw new Error(`Statement already paid: ${statementId}`);
  }

  const card = await accountsRepo.getById(statement.cardAccountId);
  if (!card || card.type !== "credit_card") {
    throw new Error(`Credit card account not found: ${statement.cardAccountId}`);
  }

  const payFromId = statement.payFromAccountId ?? card.defaultPayFromAccountId;
  if (!payFromId) {
    throw new Error(`No pay-from account configured for statement: ${statementId}`);
  }

  const amountCents = statement.plannedPaymentCents ?? statement.computedTotalCents;
  if (amountCents <= 0) {
    throw new Error(`Statement has nothing to pay: ${statementId}`);
  }

  const transaction = await transactionsRepo.create({
    type: "transfer",
    amountCents,
    accountId: payFromId,
    toAccountId: statement.cardAccountId,
    description: "Credit card statement payment",
    effectiveDate,
    paysStatementId: statement.id,
  });

  const updated = await creditCardStatementsRepo.markPaid(statement.id, transaction.id);
  return { statement: updated, transaction };
}
