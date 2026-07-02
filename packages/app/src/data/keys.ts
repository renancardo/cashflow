export const queryKeys = {
  settings: ["settings"] as const,
  accounts: ["accounts"] as const,
  transactions: (filters: Record<string, unknown> = {}) => ["transactions", filters] as const,
  projection: (asOfDate: string) => ["projection", asOfDate] as const,
};
