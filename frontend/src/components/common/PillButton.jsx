import { Button } from "antd";
import { cx } from "../../utils/cx";

/**
 * Ant Design Button in the Askeva pill style.
 * @param {"green"|"lime"|"ink"|"white"|"danger"|"muted"|"transparent"} tone
 * @param {"md"|"sm"|"xs"|"xxs"} size
 * @param {boolean} shadow  hard offset shadow (primary CTAs)
 * @param {boolean} dangerText  red label (e.g. "Decline", "Force close")
 */
export default function PillButton({ tone = "white", size = "md", shadow = false, dashed = false, dangerText = false, className, children, ...rest }) {
  return (
    <Button
      className={cx(
        "btn-pill",
        `tone-${tone}`,
        size !== "md" && `btn-${size}`,
        shadow && "btn-shadow",
        dashed && "btn-dashed",
        dangerText && "btn-text-danger",
        className,
      )}
      {...rest}
    >
      {children}
    </Button>
  );
}
