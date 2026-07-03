import { useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./SegmentedControl.module.css";

export type SegmentedControlOption<V extends string = string> = {
  value: V;
  label: ReactNode;
  disabled?: boolean;
};

type Props<V extends string = string> = {
  options: SegmentedControlOption<V>[];
  value: V;
  onChange: (value: V) => void;
  "aria-label": string;
  className?: string;
  fullWidth?: boolean;
};

function nextEnabledIndex<V extends string>(
  options: SegmentedControlOption<V>[],
  fromIndex: number,
  direction: 1 | -1,
): number {
  const count = options.length;
  for (let step = 1; step <= count; step += 1) {
    const index = (fromIndex + direction * step + count) % count;
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return fromIndex;
}

function firstEnabledIndex<V extends string>(options: SegmentedControlOption<V>[]): number {
  return options.findIndex((option) => !option.disabled);
}

function lastEnabledIndex<V extends string>(options: SegmentedControlOption<V>[]): number {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return -1;
}

export function SegmentedControl<V extends string = string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  className,
  fullWidth = false,
}: Props<V>) {
  const segmentRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusSegment = (index: number) => {
    segmentRefs.current[index]?.focus();
  };

  const selectAtIndex = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) {
      return;
    }
    onChange(option.value);
    focusSegment(index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectAtIndex(index);
      return;
    }

    let targetIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        targetIndex = nextEnabledIndex(options, index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        targetIndex = nextEnabledIndex(options, index, -1);
        break;
      case "Home":
        targetIndex = firstEnabledIndex(options);
        break;
      case "End":
        targetIndex = lastEnabledIndex(options);
        break;
      default:
        return;
    }

    if (targetIndex < 0 || targetIndex === index) {
      return;
    }

    event.preventDefault();
    selectAtIndex(targetIndex);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={[styles.control, fullWidth && styles.fullWidth, className]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            ref={(node) => {
              segmentRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            tabIndex={selected ? 0 : -1}
            className={[styles.segment, selected && styles.segmentActive].filter(Boolean).join(" ")}
            onClick={() => selectAtIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
