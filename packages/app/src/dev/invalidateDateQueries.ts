import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../data/keys";

/** Invalidate TanStack Query caches that depend on the simulated calendar date. */
export function invalidateDateSensitiveQueries(
  queryClient: QueryClient,
  previousToday: string,
  nextToday: string,
): void {
  queryClient.invalidateQueries({ queryKey: queryKeys.projection(previousToday) });
  queryClient.invalidateQueries({ queryKey: queryKeys.projection(nextToday) });
  queryClient.invalidateQueries({ queryKey: ["projection"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.accounts });
  queryClient.invalidateQueries({ queryKey: queryKeys.forecast });
  queryClient.invalidateQueries({ queryKey: ["creditCardStatements"] });
  queryClient.invalidateQueries({ queryKey: ["statementDetail"] });
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
}
