import { cx } from "../../utils/helpers/classNames";

/**
 * The signature Askeva card: ink border, hard offset shadow.
 * Renders a <button> when `onClick` is given so whole-card navigation stays accessible.
 *
 * @param {"white"|"ink"|"ink800"|"lime"|"green"|"danger"|"paper"|"rose"|"cream"} tone
 * @param {"lg"|"md"|"sm"} size  lg = 16px radius + 4px shadow, md = 12px + 3px, sm = 12px, no shadow
 */
export default function Card({ tone = "white", size = "lg", flush = false, noShadow = false, onClick, className, children, ...rest }) {
  const classes = cx(
    "card",
    `tone-${tone}`,
    size !== "lg" && `card--${size}`,
    flush && "card--flush",
    noShadow && "card--no-shadow",
    onClick && "card--clickable",
    className,
  );
  // Draggable cards stay a <div> (Firefox won't drag a <button>) with button semantics.
  if (onClick && rest.draggable) {
    return (
      <div role="button" tabIndex={0} className={classes} onClick={onClick} onKeyDown={(e) => e.key === "Enter" && onClick(e)} {...rest}>
        {children}
      </div>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={classes} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  }
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
