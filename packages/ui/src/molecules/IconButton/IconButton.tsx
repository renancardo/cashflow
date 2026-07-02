import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./IconButton.module.css";

type Props = {
  children: ReactNode;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled" | "onClick" | "title" | "aria-label">;

export function IconButton({
  children,
  className,
  type = "button",
  disabled,
  onClick,
  title,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      className={[styles.iconButton, className].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
