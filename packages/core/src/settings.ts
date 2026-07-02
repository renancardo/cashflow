import type { Settings } from "./entities.js";

export const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  language: "pt-BR",
  defaultCurrency: "BRL",
  negativeBufferCents: 0,
  largeOutflowThresholdCents: 50_000,
  horizonMonths: 24,
  alertLeadTimeDays: 14,
  defaultWorkingForType: {
    checking: true,
    savings: true,
    wallet: true,
    credit_card: false,
    investment: false,
  },
  dateFormat: "DD/MM/YYYY",
};
