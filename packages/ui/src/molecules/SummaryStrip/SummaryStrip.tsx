import type { ReactNode } from "react";
import styles from "./SummaryStrip.module.css";

type StripProps = {
  children: ReactNode;
  className?: string;
};

type ItemProps = {
  label: string;
  children: ReactNode;
  tone?: "default" | "working" | "warning" | "success";
  className?: string;
};

export function SummaryStrip({ children, className }: StripProps) {
  return <div className={[styles.strip, className].filter(Boolean).join(" ")}>{children}</div>;
}

export function SummaryStripItem({ label, children, tone = "default", className }: ItemProps) {
  return (
    <div className={[styles.item, className].filter(Boolean).join(" ")}>
      <span className={styles.label}>{label}</span>
      <span
        className={[
          styles.value,
          tone === "working" && styles.working,
          tone === "warning" && styles.warning,
          tone === "success" && styles.success,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </span>
    </div>
  );
}
