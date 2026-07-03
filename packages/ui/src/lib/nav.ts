export type NavItem = {
  label: string;
  path: string;
  icon?: string;
  disabled?: boolean;
};

export const SIDE_NAV_ITEMS: NavItem[] = [
  { label: "Year Calendar", path: "/" },
  { label: "Month Calendar", path: "/month" },
  { label: "Transactions", path: "/transactions" },
  { label: "Accounts", path: "/accounts" },
  { label: "Forecast Items", path: "/forecast" },
  { label: "Categories", path: "/categories" },
  { label: "Snapshots", path: "/snapshots", disabled: true },
  { label: "Settings", path: "/settings", disabled: true },
];
