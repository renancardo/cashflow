import type { ReactNode } from "react";
import styles from "./Chip.module.css";

export type ChipVariant =
  | "default"
  | "income"
  | "expense"
  | "planned"
  | "actual"
  | "card"
  | "installment"
  | "subscription"
  | "statement";

type Props = {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
};

export function Chip({ variant = "default", children, className }: Props) {
  return (
    <span className={[styles.chip, styles[variant], className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
