import type { ReactNode } from "react";
import styles from "./Metric.module.css";

type Props = {
  label: string;
  children: ReactNode;
  tone?: "default" | "danger";
  className?: string;
};

export function Metric({ label, children, tone = "default", className }: Props) {
  return (
    <div className={[styles.metric, className].filter(Boolean).join(" ")}>
      <span className={styles.label}>{label}</span>
      <span
        className={[styles.value, tone === "danger" && styles.danger].filter(Boolean).join(" ")}
      >
        {children}
      </span>
    </div>
  );
}
