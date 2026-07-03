import type { ReactNode } from "react";
import styles from "./Tooltip.module.css";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";
export type TooltipAlign = "start" | "center" | "end";

type Props = {
  content?: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  align?: TooltipAlign;
  className?: string;
};

export function Tooltip({
  content,
  children,
  placement = "top",
  align = "center",
  className,
}: Props) {
  if (content == null || content === "") {
    return <>{children}</>;
  }

  const alignClass =
    align === "start" ? styles.alignStart : align === "end" ? styles.alignEnd : styles.alignCenter;

  return (
    <span
      className={[styles.root, styles[placement], alignClass, className].filter(Boolean).join(" ")}
    >
      {children}
      <span className={styles.bubble} role="tooltip">
        {content}
      </span>
    </span>
  );
}
