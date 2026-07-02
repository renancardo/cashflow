import styles from "./MobileHeader.module.css";

type Props = {
  title: string;
  menuOpen?: boolean;
  onMenuToggle?: () => void;
};

export function MobileHeader({ title, menuOpen = false, onMenuToggle }: Props) {
  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="nav-drawer"
        onClick={onMenuToggle}
      >
        ☰
      </button>
      <span className={styles.title}>{title}</span>
    </header>
  );
}
