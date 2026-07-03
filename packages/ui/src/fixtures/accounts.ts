import type { AccountRowData } from "../organisms/AccountRow/AccountRow.js";

export const DEMO_ACCOUNTS: AccountRowData[] = [
  {
    id: "cora-checking",
    name: "Cora Checking",
    type: "checking",
    isWorking: true,
    balanceCents: 845_000,
    anchorDate: "2026-06-01",
  },
  {
    id: "nubank-savings",
    name: "Nubank Savings",
    type: "savings",
    isWorking: false,
    balanceCents: 1_520_000,
    anchorDate: "2026-06-01",
  },
  {
    id: "cora-card",
    name: "Cartão Cora",
    type: "credit_card",
    isWorking: false,
    balanceCents: 185_000,
    anchorDate: "2026-06-01",
  },
  {
    id: "wallet",
    name: "Carteira",
    type: "wallet",
    isWorking: true,
    balanceCents: 32_000,
    anchorDate: "2026-06-01",
  },
  {
    id: "xp",
    name: "XP Investimentos",
    type: "investment",
    isWorking: false,
    balanceCents: 4_200_000,
    anchorDate: "2026-06-01",
  },
];

export const DEMO_WORKING_BALANCE_CENTS = 877_000;
