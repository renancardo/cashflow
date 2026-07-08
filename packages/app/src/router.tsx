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
import { SettingsPage } from "./pages/SettingsPage";

type DaySearch = {
  day?: string;
};

type EditorSearch = {
  new?: true;
  edit?: string;
};

function parseEditorSearch(search: Record<string, unknown>): EditorSearch {
  const edit = typeof search.edit === "string" ? search.edit : undefined;
  if (edit) return { edit };

  const rawNew = search.new;
  const isNew =
    rawNew === true ||
    rawNew === "" ||
    rawNew === "true" ||
    rawNew === "1" ||
    rawNew === 1;

  return isNew ? { new: true } : {};
}

type ForecastEditorSearch = {
  new?: "planned" | "installment";
  planned?: string;
  installment?: string;
  statement?: string;
};

function parseForecastEditorSearch(search: Record<string, unknown>): ForecastEditorSearch {
  if (search.new === "planned" || search.new === "installment") {
    return { new: search.new };
  }

  if (typeof search.planned === "string") return { planned: search.planned };
  if (typeof search.installment === "string") return { installment: search.installment };
  if (typeof search.statement === "string") return { statement: search.statement };

  return {};
}

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

function AccountsRoute() {
  const navigate = useNavigate({ from: "/accounts" });
  const editorSearch = useSearch({ from: "/accounts" });

  return (
    <AccountsPage
      editorSearch={editorSearch}
      onEditorSearchChange={(search) => navigate({ search, replace: true })}
    />
  );
}

function TransactionsRoute() {
  const navigate = useNavigate({ from: "/transactions" });
  const editorSearch = useSearch({ from: "/transactions" });

  return (
    <TransactionsPage
      editorSearch={editorSearch}
      onEditorSearchChange={(search) => navigate({ search, replace: true })}
    />
  );
}

function CategoriesRoute() {
  const navigate = useNavigate({ from: "/categories" });
  const editorSearch = useSearch({ from: "/categories" });

  return (
    <CategoriesPage
      editorSearch={editorSearch}
      onEditorSearchChange={(search) => navigate({ search, replace: true })}
    />
  );
}

function ForecastRoute() {
  const navigate = useNavigate({ from: "/forecast" });
  const editorSearch = useSearch({ from: "/forecast" });

  return (
    <ForecastPage
      editorSearch={editorSearch}
      onEditorSearchChange={(search) => navigate({ search, replace: true })}
    />
  );
}

const accountsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/accounts",
  validateSearch: parseEditorSearch,
  component: AccountsRoute,
});

const categoriesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/categories",
  validateSearch: parseEditorSearch,
  component: CategoriesRoute,
});

const transactionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transactions",
  validateSearch: parseEditorSearch,
  component: TransactionsRoute,
});

const forecastRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forecast",
  validateSearch: parseForecastEditorSearch,
  component: ForecastRoute,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
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
  settingsRoute,
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
