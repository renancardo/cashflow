import type { FormEvent, ReactNode } from "react";
import { useMessages } from "../../i18n/LanguageContext.js";
import styles from "./EditorPanel.module.css";

type Props = {
  open: boolean;
  /** Must match the `id` of the `<h2>` inside for aria-labelledby. */
  labelId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Called when the inner form is submitted. Prevent-default is handled internally. */
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
  /** Content rendered in the sticky footer container. */
  footer: ReactNode;
  /** Content rendered in the scrollable body. */
  children: ReactNode;
};

/**
 * Generic slide-in panel shell shared by all editor panels in the app.
 * Provides the overlay, backdrop, aside, header, scrollable body and
 * sticky footer — consumers fill in body and footer content.
 */
export function EditorPanel({
  open,
  labelId,
  title,
  subtitle,
  onClose,
  onSubmit,
  footer,
  children,
}: Props) {
  const m = useMessages();

  return (
    <div
      className={[styles.overlay, open && styles.open].filter(Boolean).join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        className={styles.backdrop}
        aria-label={m.common.aria.closeEditor}
        onClick={onClose}
      />
      <aside className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <h2 className={styles.title} id={labelId}>
                {title}
              </h2>
              {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
            </div>
            <button
              type="button"
              className={styles.close}
              aria-label={m.common.aria.closeEditor}
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit?.(e);
          }}
        >
          <div className={styles.body}>{children}</div>
          <div className={styles.footer}>{footer}</div>
        </form>
      </aside>
    </div>
  );
}

/**
 * Utility wrapper for the right-side action group inside an EditorPanel footer.
 * Renders Cancel + Save buttons pushed to the trailing edge.
 */
export function EditorPanelFooterActions({ children }: { children: ReactNode }) {
  return <div className={styles.footerActions}>{children}</div>;
}
