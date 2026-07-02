import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { Label } from "../../atoms/Label/Label.js";
import styles from "./FormField.module.css";

type BaseProps = {
  label: string;
  id: string;
  hint?: ReactNode;
  className?: string;
};

type InputProps = BaseProps & {
  inputType?: "input";
} & Pick<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "defaultValue" | "onChange" | "readOnly" | "placeholder" | "required" | "min" | "max" | "step"
>;

type SelectProps = BaseProps & {
  inputType: "select";
  children: ReactNode;
} & Pick<SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue" | "onChange" | "required">;

type Props = InputProps | SelectProps;

export function FormField(props: Props) {
  const { label, id, hint, className } = props;

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <Label htmlFor={id}>{label}</Label>
      {props.inputType === "select" ? (
        <select
          id={id}
          className={styles.select}
          value={props.value}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          required={props.required}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={id}
          className={styles.input}
          type={props.type ?? "text"}
          value={props.value}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          readOnly={props.readOnly}
          placeholder={props.placeholder}
          required={props.required}
          min={props.min}
          max={props.max}
          step={props.step}
        />
      )}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
