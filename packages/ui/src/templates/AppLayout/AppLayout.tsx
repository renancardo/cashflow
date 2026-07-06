import { useState, type ReactNode } from "react";
import type { NavItem } from "../../lib/nav.js";
import { MobileHeader } from "../../organisms/MobileHeader/MobileHeader.js";
import { SideNav } from "../../organisms/SideNav/SideNav.js";
import styles from "./AppLayout.module.css";

type Props = {
  children: ReactNode;
  activePath?: string;
  mobileTitle?: string;
  navItems?: NavItem[];
  onNavigate?: (path: string) => void;
};

export function AppLayout({
  children,
  activePath = "/",
  mobileTitle,
  navItems,
  onNavigate,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className={styles.shell}>
      <SideNav
        items={navItems}
        activePath={activePath}
        open={navOpen}
        onNavigate={onNavigate}
        onClose={() => setNavOpen(false)}
      />
      <div className={styles.main}>
        {mobileTitle && (
          <MobileHeader
            title={mobileTitle}
            menuOpen={navOpen}
            onMenuToggle={() => setNavOpen((open) => !open)}
          />
        )}
        {children}
      </div>
    </div>
  );
}
