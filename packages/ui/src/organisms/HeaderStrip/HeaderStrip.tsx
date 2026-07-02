import type { ReactNode } from "react";
import styles from "./HeaderStrip.module.css";

type Props = {
  metric: ReactNode;
  action?: ReactNode;
};

export function HeaderStrip({ metric, action }: Props) {
  return (
    <header className={styles.strip}>
      {metric}
      <div className={styles.spacer} />
      {action}
    </header>
  );
}
