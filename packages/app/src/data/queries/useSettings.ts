import { useQuery } from "@tanstack/react-query";
import { settingsRepo } from "@cashflow/db";
import { queryKeys } from "../keys";

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => settingsRepo.get(),
  });
}
