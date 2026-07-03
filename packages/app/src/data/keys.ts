export const queryKeys = {
  settings: ["settings"] as const,
  accounts: ["accounts"] as const,
  categories: (month: string) => ["categories", month] as const,
  transactions: (filters: Record<string, unknown> = {}) => ["transactions", filters] as const,
  projection: (asOfDate: string) => ["projection", asOfDate] as const,
  plannedItems: ["plannedItems"] as const,
  installmentPlans: ["installmentPlans"] as const,
  forecast: ["forecast"] as const,
};
