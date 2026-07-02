import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { formatMoney } from "@cashflow/core";
import { AppStatus, MoneyAmount } from "@cashflow/ui";
import { AppShell } from "./layout/AppShell";
import { useProjection } from "./data/queries/useProjection";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

function YearCalendarPage() {
  const { data, isPending, isError, error } = useProjection();

  if (isPending) {
    return <AppStatus title="Year Calendar">Loading projection…</AppStatus>;
  }

  if (isError) {
    return (
      <AppStatus title="Year Calendar">
        Failed to load: {error instanceof Error ? error.message : "Unknown error"}
      </AppStatus>
    );
  }

  const belowBufferDays = data.days.filter((d) => d.belowBuffer).length;

  return (
    <AppStatus title="Year Calendar">
      <p>
        Working balance today: <MoneyAmount cents={data.workingBalanceTodayCents} />
      </p>
      <p>Next negative date: {data.nextNegativeDate ? data.nextNegativeDate : "None in horizon"}</p>
      <p>
        Horizon: {data.days.length} days · Below buffer: {belowBufferDays} days
      </p>
      <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        Monorepo scaffold (US-0.2). Engine stub — full logic in Epic 1. Example:{" "}
        {formatMoney(500_000)}
      </p>
    </AppStatus>
  );
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: YearCalendarPage,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
