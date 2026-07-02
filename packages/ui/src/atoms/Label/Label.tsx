import type { ReactNode } from "react";
import styles from "./Label.module.css";

type Props = {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
};

export function Label({ children, htmlFor, className }: Props) {
  return (
    <label htmlFor={htmlFor} className={[styles.label, className].filter(Boolean).join(" ")}>
      {children}
    </label>
  );
}
