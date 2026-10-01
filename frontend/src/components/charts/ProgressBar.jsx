import { cx } from "../../utils/helpers/cx";
import { wPct } from "../../utils/helpers/pct";

/**
 * Horizontal progress/burn bar (CSS only — the original had no chart library).
 * @param {number} pct  0–100 (clamped)
 * @param {"ink"|"gradient"|"danger"|"green"|"lime"|"lime500"} fill
 * @param {5|6|8|10|12} height  px (see .bar--h* in global.css)
 */
export default function ProgressBar({ pct, fill = "ink", height = 6, outlined = false, className }) {
  return (
    <div className={cx("bar", `bar--h${height}`, outlined && "bar--outlined", className)}>
      <div className={cx("bar__fill", fill !== "ink" && `bar__fill--${fill}`, wPct(pct))} />
    </div>
  );
}
