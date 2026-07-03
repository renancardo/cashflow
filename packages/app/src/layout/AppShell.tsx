import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppLayout } from "@cashflow/ui";

const MOBILE_TITLES: Record<string, string> = {
  "/": "Year Calendar",
  "/accounts": "Accounts",
  "/categories": "Categories",
  "/transactions": "Transactions",
  "/forecast": "Forecast",
};

function resolveMobileTitle(pathname: string): string | undefined {
  if (MOBILE_TITLES[pathname]) return MOBILE_TITLES[pathname];
  if (pathname.startsWith("/month/")) return "Month Calendar";
  return undefined;
}

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const mobileTitle = resolveMobileTitle(pathname);

  return (
    <AppLayout
      activePath={pathname}
      mobileTitle={mobileTitle}
      onNavigate={(path) => navigate({ to: path })}
    >
      <Outlet />
    </AppLayout>
  );
}
