import { cx } from "../../utils/helpers/classNames";

/** Small square check button used for follow-ups, gates, milestones, CR email flags. */
export default function CheckToggle({ checked, onChange, title, variant = "green", disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={!!checked}
      disabled={disabled}
      className={cx("check-toggle", checked && "check-toggle--on", variant === "lime" && "check-toggle--lime")}
      onClick={onChange}
    >
      {checked ? "✓" : ""}
    </button>
  );
}
