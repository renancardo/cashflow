import styles from "./Indicator.module.css";

export type IndicatorKind = "danger" | "success" | "warning" | "card";

type Props = {
  kind: IndicatorKind;
  className?: string;
};

export function Indicator({ kind, className }: Props) {
  return (
    <span
      className={[styles.indicator, styles[kind], className].filter(Boolean).join(" ")}
      aria-hidden
    />
  );
}
