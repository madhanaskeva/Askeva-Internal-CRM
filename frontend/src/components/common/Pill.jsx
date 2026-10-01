import { cx } from "../../utils/helpers/cx";

/**
 * Mono status tag with an ink border (stage, health, status, severity…).
 * @param {string} tone  tone key — see `.tone-*` in global.css
 * @param {"xs"|"sm"|"md"} size
 */
export default function Pill({ tone = "white", size = "sm", bold = false, className, children, ...rest }) {
  return (
    <span
      className={cx("pill", `tone-${tone}`, size === "xs" && "pill--xs", size === "md" && "pill--md", bold && "pill--bold", className)}
      {...rest}
    >
      {children}
    </span>
  );
}
