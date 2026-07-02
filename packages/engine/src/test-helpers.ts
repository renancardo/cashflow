import type { ProjectionDay, ProjectionResult } from "@cashflow/core";

export function dayOf(result: ProjectionResult, date: string): ProjectionDay | undefined {
  return result.days.find((d) => d.date === date);
}

export function itemsOnDate(
  result: ProjectionResult,
  date: string,
  filter?: { source?: ProjectionDay["items"][number]["source"]; refId?: string },
) {
  const day = dayOf(result, date);
  if (!day) return [];
  return day.items.filter((item) => {
    if (filter?.source && item.source !== filter.source) return false;
    if (filter?.refId && item.refId !== filter.refId) return false;
    return true;
  });
}

export function projectedItemsOnDate(
  result: ProjectionResult,
  date: string,
  filter?: { source?: ProjectionDay["items"][number]["source"]; refId?: string },
) {
  return itemsOnDate(result, date, filter).filter((item) => item.isProjected);
}
