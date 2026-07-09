import { useQuery } from "@tanstack/react-query";
import { projectCashFlow } from "@cashflow/engine";
import { loadEngineInput } from "@cashflow/db";
import { queryKeys } from "../keys";
import { useAppClock } from "../../dev/useAppClock";

export function useProjection() {
  const { today } = useAppClock();

  return useQuery({
    queryKey: queryKeys.projection(today),
    queryFn: async () => {
      const input = await loadEngineInput();
      return projectCashFlow(input, today);
    },
  });
}
