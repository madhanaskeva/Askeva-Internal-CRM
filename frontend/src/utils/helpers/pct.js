// Map a percentage to a utility class from styles/utilities.css (no inline styles).
const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

/** width: n% → "w-pct-n" */
export const wPct = (n) => `w-pct-${clamp(n)}`;

/** height: n% → "h-pct-n" */
export const hPct = (n) => `h-pct-${clamp(n)}`;

/** left: n% → "l-pct-n" (absolutely positioned markers) */
export const lPct = (n) => `l-pct-${clamp(n)}`;
