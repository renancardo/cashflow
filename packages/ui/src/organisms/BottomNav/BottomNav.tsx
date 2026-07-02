import type { NavItem } from "../../lib/nav.js";
import { BOTTOM_NAV_ITEMS } from "../../lib/nav.js";
import styles from "./BottomNav.module.css";

type Props = {
  items?: NavItem[];
  activePath?: string;
  onNavigate?: (path: string) => void;
};

export function BottomNav({ items = BOTTOM_NAV_ITEMS, activePath = "/", onNavigate }: Props) {
  return (
    <nav className={styles.bottomNav} aria-label="Main">
      {items.map((item) => {
        const isActive = item.path === activePath;
        const className = item.disabled
          ? styles.itemDisabled
          : isActive
            ? styles.itemActive
            : styles.item;

        if (item.disabled) {
          return (
            <span key={item.path} className={className}>
              {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
              {item.label}
            </span>
          );
        }

        return (
          <a
            key={item.path}
            href={item.path}
            className={className}
            aria-current={isActive ? "page" : undefined}
            onClick={(event) => {
              if (onNavigate) {
                event.preventDefault();
                onNavigate(item.path);
              }
            }}
          >
            {item.icon && <span className={styles.icon} aria-hidden="true">{item.icon}</span>}
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
