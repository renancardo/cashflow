import type { AccountType } from "@cashflow/core";
import type { ChipVariant } from "../atoms/Chip/Chip.js";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  wallet: "Wallet",
  credit_card: "Credit card",
  investment: "Investment",
};

export function accountTypeChipVariant(type: AccountType): ChipVariant {
  return type === "credit_card" ? "card" : "default";
}

export function defaultIsWorking(type: AccountType): boolean {
  return type !== "credit_card" && type !== "investment";
}
