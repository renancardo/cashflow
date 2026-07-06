import type { ReactNode } from "react";
import { Button } from "../../atoms/Button/Button.js";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./AccountList.module.css";

type Props = {
  children?: ReactNode;
  empty?: boolean;
  onAddAccount?: () => void;
};

export function AccountList({ children, empty = false, onAddAccount }: Props) {
  const m = useMessages();

  if (empty) {
    return (
      <section className={styles.list} aria-label={m.common.aria.accountList}>
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{m.accounts.empty.title}</h2>
          <p className={styles.emptyBody}>{m.accounts.empty.body}</p>
          {onAddAccount && (
            <Button variant="primary" onClick={onAddAccount}>
              {m.accounts.addFirstAccount}
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.list} aria-label={m.common.aria.accountList}>
      <div className={styles.header}>
        <span>{m.accounts.list.account}</span>
        <span>{m.accounts.list.working}</span>
        <span>{m.accounts.list.balance}</span>
        <span />
      </div>
      {children}
    </section>
  );
}
