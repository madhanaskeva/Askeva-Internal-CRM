import { cx } from "../../utils/cx";

/** Square dot + uppercase tracked label ("TODAY'S FOLLOW-UPS"). Use `onDark` inside ink cards. */
export default function SectionLabel({ children, onDark = false, dotClassName, className, extra }) {
  return (
    <div className={cx("section-label", onDark && "section-label--on-dark", className)}>
      <span className={cx("section-label__dot", dotClassName)} />
      <span className="flex-1">{children}</span>
      {extra}
    </div>
  );
}
