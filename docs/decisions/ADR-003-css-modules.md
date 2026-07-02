# ADR-003: CSS Modules + global design tokens (not Tailwind)

**Status:** Accepted  
**Date:** 2026-07-01  
**Deciders:** Renan  
**User story:** [US-0.1](../user-stories/00-foundation.md#us-01--evaluate-and-lock-the-phase-1-tech-stack)

---

## Context

Phase 1 visual design is **locked** in [004-style-guide.md](../specs/004-style-guide.md) with a canonical CSS implementation in `prototype/004/css/paper.css`. The calendar has **semantic states** (red dot = below buffer, weekend bands, projected vs actual entry colors) that must stay aligned with the style guide.

We need a styling approach that:

- Ports the existing Paper tokens with minimal friction
- Makes calendar/debugging in DevTools straightforward
- Works in **Storybook** without extra build plugins
- Keeps component styles **local** (no global class collisions)

**Preference stated:** CSS Modules — easier to debug than utility-class strings.

---

## Decision

| Layer | Approach |
|---|---|
| Global tokens | `packages/ui/src/tokens/paper.css` — CSS variables from 004 / `prototype/004` |
| Component styles | **CSS Modules** (`.module.css`) colocated with components |
| No Tailwind | Utility framework not adopted in Phase 1 |

Import pattern:

```tsx
// packages/ui/src/components/CalendarDayCell/CalendarDayCell.tsx
import styles from "./CalendarDayCell.module.css";

type Props = {
  day: number;
  belowBuffer: boolean;
  isWeekend: boolean;
  isToday: boolean;
};

export function CalendarDayCell({ day, belowBuffer, isWeekend, isToday }: Props) {
  return (
    <button
      type="button"
      className={[
        styles.cell,
        isWeekend && styles.weekend,
        isToday && styles.today,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.dayNum}>{day}</span>
      {belowBuffer && <span className={styles.riskDot} aria-label="Below buffer" />}
    </button>
  );
}
```

```css
/* CalendarDayCell.module.css */
.cell {
  position: relative;
  min-width: var(--touch-min);
  min-height: var(--touch-min);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-family: var(--font-mono);
  cursor: pointer;
}

.weekend {
  background: var(--color-weekend);
}

.today {
  outline: 2px solid var(--color-secondary);
  outline-offset: -2px;
}

.dayNum {
  font-size: 0.75rem;
  color: var(--color-text);
}

.riskDot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-danger);
}
```

Storybook loads global tokens once in `preview.ts`:

```typescript
// packages/ui/.storybook/preview.ts
import "../src/tokens/paper.css";

export default {
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "paper",
      values: [{ name: "paper", value: "#faf8f5" }],
    },
  },
};
```

---

## Alternatives considered: CSS Modules vs Tailwind

Same component — **calendar day cell with below-buffer red dot**.

### CSS Modules (chosen)

**DevTools:** inspect `CalendarDayCell_cell__x7f2a` → rules live in `CalendarDayCell.module.css` with real property names.

**Pros**

- Direct port of `prototype/004/css/*.css`
- Semantic class names (`riskDot`, `weekend`) match style guide vocabulary
- No `@apply` indirection; what you read is what runs
- Scoped hashes prevent collisions without memorizing utilities

**Cons**

- More files (`.tsx` + `.module.css` per component)
- Dynamic variants need explicit classes or composition (not string concatenation of utilities)

### Tailwind (rejected)

```tsx
// Hypothetical — NOT adopted
export function CalendarDayCell({ day, belowBuffer, isWeekend, isToday }: Props) {
  return (
    <button
      type="button"
      className={cn(
        "relative min-h-[44px] min-w-[44px] border border-gray-200 bg-white font-mono text-xs cursor-pointer",
        isWeekend && "bg-gray-100",
        isToday && "outline outline-2 outline-violet-500 -outline-offset-2",
      )}
    >
      <span>{day}</span>
      {belowBuffer && (
        <span
          className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-600"
          aria-label="Below buffer"
        />
      )}
    </button>
  );
}
```

**Pros**

- Fast iteration without new CSS files
- Consistent spacing scale out of the box

**Cons**

- Long `className` strings are **harder to debug** — styles scattered across JSX, not one stylesheet
- Paper theme needs full `tailwind.config` token mapping (`--color-danger` → `red-600` drift risk)
- Semantic calendar rules from 004 (entry line colors, past-due red) become long conditional utility chains
- `prototype/004` investment doesn't transfer — rewrite as utilities

### Hybrid (rejected for Phase 1)

Tailwind for layout + CSS Modules for calendar — two mental models, unclear boundary.

---

## Comparison summary

| Criterion | CSS Modules | Tailwind |
|---|---|---|
| Debug in DevTools | Single `.module.css` file per component | Utilities embedded in JSX |
| Port from `prototype/004` | Copy/adapt CSS directly | Re-tokenize everything |
| Semantic states (red dot, past-due) | Named classes | Long `className` conditionals |
| Storybook | Import `paper.css` + modules | Needs Tailwind in Storybook vite config |
| Bundle | Small, only used classes | Purge helps; config overhead |
| Solo maintainer preference | **Matches** | Conflicts with debug workflow |

---

## Consequences

**Positive**

- Style guide stays the source of truth; CSS variables unchanged
- Calendar components readable in isolation (Storybook)
- Clear split: tokens global, component layout local

**Negative**

- No utility-speed for one-off layouts — acceptable for a design-locked product
- Need a convention for shared patterns (e.g. `@compose` or shared module `buttons.module.css`)

**Conventions**

- One folder per component: `ComponentName.tsx` + `ComponentName.module.css`
- Use **CSS variables** for colors/spacing — never hardcode `#dc2626` in modules
- Complex calendar grids may share `calendar.module.css` primitives — document in style guide

**Follow-ups**

- Port `paper.css` tokens to `packages/ui/src/tokens/`
- [US-0.3](../user-stories/00-foundation.md#us-03--storybook-with-paper-theme-baseline) — Storybook with token decorator
