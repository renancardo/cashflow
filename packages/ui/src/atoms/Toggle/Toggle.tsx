import styles from "./Toggle.module.css";

type Props = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
};

export function Toggle({ checked, onChange, disabled, "aria-label": ariaLabel, className }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      className={[styles.toggle, checked && styles.toggleOn, className].filter(Boolean).join(" ")}
      onClick={() => onChange?.(!checked)}
    >
      <span className={styles.knob} />
    </button>
  );
}
