import styles from "./AppShell.module.css";

type Props = {
  children: React.ReactNode;
};

const NAV = [
  { label: "Year", path: "/" },
  { label: "Transactions", path: "/transactions", disabled: true },
  { label: "Accounts", path: "/accounts", disabled: true },
  { label: "Settings", path: "/settings", disabled: true },
];

export function AppShell({ children }: Props) {
  return (
    <div className={styles.shell}>
      <aside className={styles.nav}>
        <div className={styles.brand}>Cashflow</div>
        <nav className={styles.navList}>
          {NAV.map((item) => (
            <span
              key={item.path}
              className={item.disabled ? styles.navItemDisabled : styles.navItem}
            >
              {item.label}
              {item.disabled && " (soon)"}
            </span>
          ))}
        </nav>
      </aside>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
