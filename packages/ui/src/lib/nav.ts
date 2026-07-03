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
  { label: "Categories", path: "/categories" },
  { label: "Snapshots", path: "/snapshots", disabled: true },
  { label: "Settings", path: "/settings", disabled: true },
];
