import type { CreditCardStatement, Transaction } from "@cashflow/core";
import { accountsRepo } from "../repos/accounts.js";
import { creditCardStatementsRepo } from "../repos/creditCardStatements.js";
import { transactionsRepo } from "../repos/transactions.js";
import { recomputeStatementTotalsForCard } from "../materialize/statements.js";

export type SettleStatementResult = {
  statement: CreditCardStatement;
  transaction: Transaction;
};

export type SettleStatementOptions = {
  /** Explicit payment amount (clamped to remaining balance). */
  amountCents?: number;
  /** Pay the full remaining balance (ignores plannedPaymentCents). */
  payRemaining?: boolean;
};

/**
 * Records a credit card statement payment as a transfer from the working account to the card.
 * Supports first payment and additional payments on `partially_paid` statements.
 * Partial amounts leave remainder for carryover after closing (US-6.5).
 */
export async function settleStatement(
  statementId: string,
  effectiveDate: string,
  options: SettleStatementOptions = {},
): Promise<SettleStatementResult> {
  const statement = await creditCardStatementsRepo.getById(statementId);
  if (!statement) {
    throw new Error(`CreditCardStatement not found: ${statementId}`);
  }
  if (statement.status === "paid") {
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

  const alreadyPaidCents = statement.paidAmountCents ?? 0;
  const remainingCents = Math.max(0, statement.computedTotalCents - alreadyPaidCents);
  if (remainingCents <= 0) {
    throw new Error(`Statement has nothing to pay: ${statementId}`);
  }

  const requestedCents = options.payRemaining
    ? remainingCents
    : (options.amountCents ?? statement.plannedPaymentCents ?? remainingCents);
  const amountCents = Math.min(Math.max(0, requestedCents), remainingCents);
  if (amountCents <= 0) {
    throw new Error(`Statement has nothing to pay: ${statementId}`);
  }

  const transaction = await transactionsRepo.create({
    type: "transfer",
    amountCents,
    accountId: payFromId,
    toAccountId: statement.cardAccountId,
    description:
      alreadyPaidCents > 0
        ? "Credit card statement payment (additional)"
        : "Credit card statement payment",
    effectiveDate,
    paysStatementId: statement.id,
  });

  const newPaidCents = alreadyPaidCents + amountCents;
  const updated =
    newPaidCents >= statement.computedTotalCents
      ? await creditCardStatementsRepo.markPaid(statement.id, transaction.id, newPaidCents)
      : await creditCardStatementsRepo.markPartiallyPaid(
          statement.id,
          transaction.id,
          newPaidCents,
        );

  recomputeStatementTotalsForCard(statement.cardAccountId, effectiveDate);

  return {
    statement: (await creditCardStatementsRepo.getById(updated.id)) ?? updated,
    transaction,
  };
}
