export type NavItem = {
  label: string;
  path: string;
  icon?: string;
  disabled?: boolean;
};

export const SIDE_NAV_ITEMS: NavItem[] = [
  { label: "Year Calendar", path: "/" },
  { label: "Month Calendar", path: "/month", disabled: true },
  { label: "Transactions", path: "/transactions", disabled: true },
  { label: "Accounts", path: "/accounts" },
  { label: "Forecast Items", path: "/forecast", disabled: true },
  { label: "Categories", path: "/categories", disabled: true },
  { label: "Snapshots", path: "/snapshots", disabled: true },
  { label: "Settings", path: "/settings", disabled: true },
];

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: "Calendar", path: "/", icon: "📅" },
  { label: "Transactions", path: "/transactions", icon: "↕", disabled: true },
  { label: "Forecast", path: "/forecast", icon: "◎", disabled: true },
  { label: "Categories", path: "/categories", icon: "▦", disabled: true },
  { label: "More", path: "/accounts", icon: "⋯" },
];
