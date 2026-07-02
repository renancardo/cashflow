import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "ghost" | "icon";

type Props = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled" | "onClick" | "aria-label">;

export function Button({
  variant = "primary",
  children,
  className,
  type = "button",
  disabled,
  onClick,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
