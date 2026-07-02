import styles from "./AppStatus.module.css";

type Props = {
  title: string;
  children?: React.ReactNode;
};

export function AppStatus({ title, children }: Props) {
  return (
    <div className={styles.panel}>
      <h1 className={styles.title}>{title}</h1>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
