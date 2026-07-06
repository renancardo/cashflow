import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import type { Language } from "@cashflow/core";
import { messagesFor } from "@cashflow/core";
import { AppLayout, LanguageProvider, SIDE_NAV_ITEMS } from "@cashflow/ui";
import { useSettings } from "../data/queries/useSettings";

function navLabel(path: string, language: Language): string | undefined {
  const m = messagesFor(language);
  switch (path) {
    case "/year":
      return m.nav.yearCalendar;
    case "/month":
      return m.nav.monthCalendar;
    case "/transactions":
      return m.nav.transactions;
    case "/accounts":
      return m.nav.accounts;
    case "/forecast":
      return m.nav.forecast;
    case "/categories":
      return m.nav.categories;
    case "/settings":
      return m.nav.settings;
    default:
      return undefined;
  }
}

function resolveMobileTitle(pathname: string, language: Language): string | undefined {
  if (pathname.startsWith("/month/")) return messagesFor(language).nav.monthCalendar;
  return navLabel(pathname, language);
}

export function AppShell() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: settings } = useSettings();
  const language = settings?.language ?? "pt-BR";
  const mobileTitle = resolveMobileTitle(pathname, language);
  const navItems = SIDE_NAV_ITEMS.map((item) => ({
    ...item,
    label: navLabel(item.path, language) ?? item.label,
  }));

  return (
    <LanguageProvider language={language} dateFormat={settings?.dateFormat}>
      <AppLayout
        activePath={pathname}
        mobileTitle={mobileTitle}
        navItems={navItems}
        onNavigate={(path) => navigate({ to: path })}
      >
        <Outlet />
      </AppLayout>
    </LanguageProvider>
  );
}
