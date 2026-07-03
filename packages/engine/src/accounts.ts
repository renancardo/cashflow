import type { Account, Transaction } from "@cashflow/core";
import { addDays } from "./dates.js";

export type AccountMap = Map<string, Account>;

export function buildAccountMap(accounts: Account[]): AccountMap {
  return new Map(accounts.map((a) => [a.id, a]));
}

export function isWorkingAccount(account: Account | undefined): boolean {
  return Boolean(account?.isWorking && !account.archivedAt);
}

/** Per-account balance delta from a transaction (cash-on-hand sign for working accounts). */
export function transactionAccountDelta(tx: Transaction, accountId: string): number {
  if (tx.accountId === accountId) {
    if (tx.type === "income") return tx.amountCents;
    if (tx.type === "expense") return -tx.amountCents;
    if (tx.type === "transfer") return -tx.amountCents;
  }
  if (tx.type === "transfer" && tx.toAccountId === accountId) {
    return tx.amountCents;
  }
  return 0;
}

/** Balance of one account at the start of `beforeDate` (exclusive). */
export function accountBalanceAt(
  account: Account,
  transactions: Transaction[],
  beforeDate: string,
): number {
  let balance = account.anchorBalanceCents;

  for (const tx of transactions) {
    if (tx.effectiveDate < account.anchorDate || tx.effectiveDate >= beforeDate) continue;

    if (account.type === "credit_card") {
      if (tx.accountId === account.id) {
        if (tx.type === "expense") balance += tx.amountCents;
        if (tx.type === "income") balance -= tx.amountCents;
      }
      if (tx.type === "transfer" && tx.toAccountId === account.id) {
        balance -= tx.amountCents;
      }
      continue;
    }

    balance += transactionAccountDelta(tx, account.id);
  }

  return balance;
}

/** Balance of one working account at the start of `beforeDate` (exclusive). */
export function workingAccountBalanceAt(
  account: Account,
  transactions: Transaction[],
  beforeDate: string,
): number {
  if (!isWorkingAccount(account)) return 0;

  let balance = account.anchorBalanceCents;
  for (const tx of transactions) {
    if (tx.effectiveDate < account.anchorDate || tx.effectiveDate >= beforeDate) continue;
    balance += transactionAccountDelta(tx, account.id);
  }
  return balance;
}

/** Aggregate working balance at the start of `beforeDate`. */
export function aggregateWorkingBalanceAt(
  accounts: Account[],
  transactions: Transaction[],
  beforeDate: string,
): number {
  return accounts
    .filter(isWorkingAccount)
    .reduce((sum, account) => sum + workingAccountBalanceAt(account, transactions, beforeDate), 0);
}

/** Working balance through `throughDate` inclusive (matches end-of-day on that date). */
export function aggregateWorkingBalanceThrough(
  accounts: Account[],
  transactions: Transaction[],
  throughDate: string,
): number {
  return aggregateWorkingBalanceAt(accounts, transactions, addDays(throughDate, 1));
}

/** Account balance through `throughDate` inclusive. */
export function accountBalanceThrough(
  account: Account,
  transactions: Transaction[],
  throughDate: string,
): number {
  return accountBalanceAt(account, transactions, addDays(throughDate, 1));
}
