import { cx } from "../../utils/helpers/cx";
import { wPct } from "../../utils/helpers/pct";

/**
 * Segmented horizontal bar. Each segment: { key, pct, tone } where tone is a `.tone-*` key.
 * @param {8|10|12} height px (see .bar--h* in global.css)
 */
export default function StackedBar({ segments, height = 12 }) {
  return (
    <div className={cx("stacked-bar", `bar--h${height}`)}>
      {segments.map((s) => (
        <div key={s.key} className={cx(`tone-${s.tone}`, wPct(s.pct))} title={s.title} />
      ))}
    </div>
  );
}
