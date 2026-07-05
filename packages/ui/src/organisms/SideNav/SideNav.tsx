import type { NavItem } from "../../lib/nav.js";
import { SIDE_NAV_ITEMS } from "../../lib/nav.js";
import styles from "./SideNav.module.css";

type Props = {
  items?: NavItem[];
  activePath?: string;
  open?: boolean;
  onNavigate?: (path: string) => void;
  onClose?: () => void;
};

export function SideNav({
  items = SIDE_NAV_ITEMS,
  activePath = "/year",
  open = false,
  onNavigate,
  onClose,
}: Props) {
  return (
    <>
      <button
        type="button"
        className={[styles.overlay, open && styles.overlayVisible].filter(Boolean).join(" ")}
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <nav
        id="nav-drawer"
        className={[styles.nav, open && styles.open].filter(Boolean).join(" ")}
        aria-label="Main navigation"
      >
        <div className={styles.brand}>Cashflow</div>
        <div>
          <ul className={styles.list}>
            {items.map((item) => {
              const isActive = activePath.startsWith(item.path);
              const className = item.disabled
                ? styles.linkDisabled
                : isActive
                  ? styles.linkActive
                  : styles.link;

              if (item.disabled) {
                return (
                  <li key={item.path}>
                    <span className={className}>{item.label}</span>
                  </li>
                );
              }

              return (
                <li key={item.path}>
                  <a
                    href={item.path}
                    className={className}
                    aria-current={isActive ? "page" : undefined}
                    onClick={(event) => {
                      if (onNavigate) {
                        event.preventDefault();
                        onNavigate(item.path);
                        onClose?.();
                      }
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
