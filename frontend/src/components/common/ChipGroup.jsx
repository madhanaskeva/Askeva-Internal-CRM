import { cx } from "../../utils/helpers/classNames";

/**
 * Row of pill-shaped filter/toggle chips (single select).
 * @param {{value:string,label:string}[]} options
 * @param {string} activeTone  tone applied to the selected chip ("ink" or "lime")
 */
export default function ChipGroup({ label, options, value, onChange, activeTone = "ink", className }) {
  return (
    <div className={cx("chip-group", className)}>
      {label && <span className="chip-group__label">{label}</span>}
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={cx("chip", o.value === value ? `tone-${activeTone}` : "tone-white")}
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
