import { useEffect, useRef, useState } from "react";
import styles from "./InlineEditableText.module.css";

type Props = {
  value: string;
  ariaLabel: string;
  disabled?: boolean;
  editKey: string;
  activeEditKey: string | null;
  onActiveEditKeyChange: (key: string | null) => void;
  onSave: (value: string) => void;
  className?: string;
};

export function InlineEditableText({
  value,
  ariaLabel,
  disabled = false,
  editKey,
  activeEditKey,
  onActiveEditKeyChange,
  onSave,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const isEditing = activeEditKey === editKey;

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled) return;
    onActiveEditKeyChange(editKey);
    setDraft(value);
  };

  const finishEditing = (save: boolean) => {
    if (!isEditing) return;

    if (!save) {
      setDraft(value);
      onActiveEditKeyChange(null);
      return;
    }

    const next = draft.trim();
    if (next !== value) {
      onSave(next);
    }

    onActiveEditKeyChange(null);
  };

  const rootClass = [isEditing ? styles.editing : styles.editable, className]
    .filter(Boolean)
    .join(" ");

  if (isEditing) {
    return (
      <div className={rootClass}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          aria-label={ariaLabel}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              finishEditing(true);
            }
            if (event.key === "Escape") {
              event.preventDefault();
              finishEditing(false);
            }
          }}
          onBlur={() => finishEditing(true)}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      className={rootClass}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={startEditing}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startEditing();
        }
      }}
    >
      {value}
    </button>
  );
}
