import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
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
  /** Static adornment rendered inside the field, before the input (e.g. a currency code). */
  prefix?: ReactNode;
} & Pick<
    InputHTMLAttributes<HTMLInputElement>,
    | "type"
    | "value"
    | "defaultValue"
    | "onChange"
    | "onBlur"
    | "readOnly"
    | "placeholder"
    | "required"
    | "min"
    | "max"
    | "step"
    | "inputMode"
    | "autoFocus"
  >;

type SelectProps = BaseProps & {
  inputType: "select";
  children: ReactNode;
} & Pick<
    SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "defaultValue" | "onChange" | "required"
  >;

type TextareaProps = BaseProps & {
  inputType: "textarea";
} & Pick<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    | "value"
    | "defaultValue"
    | "onChange"
    | "onBlur"
    | "readOnly"
    | "placeholder"
    | "required"
    | "rows"
  >;

type Props = InputProps | SelectProps | TextareaProps;

function FieldInput(props: InputProps) {
  const input = (
    <input
      id={props.id}
      className={styles.input}
      type={props.type ?? "text"}
      value={props.value}
      defaultValue={props.defaultValue}
      onChange={props.onChange}
      onBlur={props.onBlur}
      readOnly={props.readOnly}
      placeholder={props.placeholder}
      required={props.required}
      min={props.min}
      max={props.max}
      step={props.step}
      inputMode={props.inputMode}
      autoFocus={props.autoFocus}
    />
  );

  if (!props.prefix) return input;

  return (
    <div className={styles.inputGroup}>
      <span className={styles.prefix} aria-hidden="true">
        {props.prefix}
      </span>
      {input}
    </div>
  );
}

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
      ) : props.inputType === "textarea" ? (
        <textarea
          id={id}
          className={styles.textarea}
          value={props.value}
          defaultValue={props.defaultValue}
          onChange={props.onChange}
          onBlur={props.onBlur}
          readOnly={props.readOnly}
          placeholder={props.placeholder}
          required={props.required}
          rows={props.rows ?? 4}
        />
      ) : (
        <FieldInput {...props} />
      )}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  );
}
