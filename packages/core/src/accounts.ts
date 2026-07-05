import type { AccountType, Settings } from "./entities.js";

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

export function defaultIsWorking(
  type: AccountType,
  settings?: Pick<Settings, "defaultWorkingForType">,
): boolean {
  if (type === "credit_card") return false;
  const configured = settings?.defaultWorkingForType?.[type];
  if (configured !== undefined) return configured;
  return type !== "investment";
}
