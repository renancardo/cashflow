import type { TxType } from "./entities.js";

export const TX_TYPES = ["income", "expense", "transfer"] as const satisfies readonly TxType[];

export const TX_TYPE_LABELS: Record<TxType, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
};

export type TxTypeChipVariant = "income" | "expense" | "card";

export function txTypeChipVariant(type: TxType): TxTypeChipVariant {
  if (type === "income") return "income";
  if (type === "expense") return "expense";
  return "card";
}
