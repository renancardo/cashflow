import type { AccountType } from "./entities.js";

export const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "wallet",
  "credit_card",
  "investment",
] as const satisfies readonly AccountType[];

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  wallet: "Wallet",
  credit_card: "Credit card",
  investment: "Investment",
};

export type AccountTypeChipVariant = "card" | "default";

export function accountTypeChipVariant(type: AccountType): AccountTypeChipVariant {
  return type === "credit_card" ? "card" : "default";
}

export function defaultIsWorking(type: AccountType): boolean {
  return type !== "credit_card" && type !== "investment";
}
