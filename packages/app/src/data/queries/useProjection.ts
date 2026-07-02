import { useQuery } from "@tanstack/react-query";
import { projectCashFlow } from "@cashflow/engine";
import { loadEngineInput } from "@cashflow/db";
import { todayIso } from "@cashflow/core";
import { queryKeys } from "../keys";

export function useProjection(asOfDate: string = todayIso()) {
  return useQuery({
    queryKey: queryKeys.projection(asOfDate),
    queryFn: async () => {
      const input = await loadEngineInput();
      return projectCashFlow(input, asOfDate);
    },
  });
}
