import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AppLayout } from "@cashflow/ui";

const MOBILE_TITLES: Record<string, string> = {
  "/": "Year Calendar",
  "/accounts": "Accounts",
};

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const mobileTitle = MOBILE_TITLES[pathname];

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
