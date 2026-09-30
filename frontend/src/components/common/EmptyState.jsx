import { cx } from "../../utils/cx";

/** Muted one-line placeholder for empty lists (the original used plain muted text). */
export default function EmptyState({ children, className }) {
  return <div className={cx("text-muted fs-12-5", className)}>{children}</div>;
}
