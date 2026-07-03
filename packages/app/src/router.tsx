import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { todayIso } from "@cashflow/core";
import { AppShell } from "./layout/AppShell";
import { CalendarPage } from "./pages/CalendarPage";
import { MonthCalendarPage } from "./pages/MonthCalendarPage";
import { AccountsPage } from "./pages/AccountsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { ForecastPage } from "./pages/ForecastPage";

type DaySearch = {
  day?: string;
};

const rootRoute = createRootRoute({
  component: AppShell,
});

function YearCalendarRoute() {
  const navigate = useNavigate({ from: "/year" });
  const { day } = useSearch({ from: "/year" });

  return (
    <CalendarPage
      selectedDay={day ?? null}
      onSelectedDayChange={(date) => navigate({ search: date ? { day: date } : {}, replace: true })}
    />
  );
}

function MonthCalendarRoute() {
  const navigate = useNavigate({ from: "/month/$yearMonth" });
  const { yearMonth } = useParams({ from: "/month/$yearMonth" });
  const { day } = useSearch({ from: "/month/$yearMonth" });

  return (
    <MonthCalendarPage
      month={yearMonth}
      selectedDay={day ?? null}
      onSelectedDayChange={(date) => navigate({ search: date ? { day: date } : {}, replace: true })}
      onMonthChange={(month) =>
        navigate({
          to: "/month/$yearMonth",
          params: { yearMonth: month },
          search: day ? { day } : {},
        })
      }
    />
  );
}

const indexRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({
      to: "/year",
    });
  },
});

const yearCalendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/year",
  validateSearch: (search: Record<string, unknown>): DaySearch => ({
    day: typeof search.day === "string" ? search.day : undefined,
  }),
  component: YearCalendarRoute,
});

const monthRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/month",
  beforeLoad: () => {
    throw redirect({
      to: "/month/$yearMonth",
      params: { yearMonth: todayIso().slice(0, 7) },
    });
  },
});

const monthRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/month/$yearMonth",
  validateSearch: (search: Record<string, unknown>): DaySearch => ({
    day: typeof search.day === "string" ? search.day : undefined,
  }),
  component: MonthCalendarRoute,
});

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  component: AccountsPage,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories",
  component: CategoriesPage,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  component: TransactionsPage,
});

const forecastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forecast",
  component: ForecastPage,
});

const routeTree = rootRoute.addChildren([
  indexRedirectRoute,
  yearCalendarRoute,
  monthRedirectRoute,
  monthRoute,
  accountsRoute,
  categoriesRoute,
  transactionsRoute,
  forecastRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
