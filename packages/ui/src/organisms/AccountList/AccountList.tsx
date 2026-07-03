import type { ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import styles from "./AccountList.module.css";

type Props = {
  children?: ReactNode;
  empty?: boolean;
  onAddAccount?: () => void;
};

export function AccountList({ children, empty = false, onAddAccount }: Props) {
  if (empty) {
    return (
      <section className={styles.list} aria-label="Account list">
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>No accounts yet</h2>
          <p className={styles.emptyBody}>
            Add your first account to start forecasting cash flow from real balances.
          </p>
          {onAddAccount && (
            <Button variant="primary" onClick={onAddAccount}>
              + Add first account
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.list} aria-label="Account list">
      <div className={styles.header}>
        <span>Account</span>
        <span>Working</span>
        <span>Balance</span>
        <span />
      </div>
      {children}
    </section>
  );
}
