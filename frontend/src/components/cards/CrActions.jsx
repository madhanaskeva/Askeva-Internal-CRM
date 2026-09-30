import { crmActions } from "../../redux/slices/crmSlice";
import { withCtx } from "../../utils/actions/context";
import PillButton from "../common/PillButton";

/** "→ Next status" button for a CR row (disabled when locked). `cr` is a mapCr() view-model. */
export function CrNextButton({ cr }) {
  return (
    <PillButton
      size="xs"
      tone={cr.locked ? "muted" : "lime"}
      disabled={cr.locked}
      onClick={() => withCtx(crmActions.crAdvanced, { crId: cr.id })}
    >
      {cr.nextLabel}
    </PillButton>
  );
}

/** Checkbox line for "client email confirmation received" on quoted CRs. */
export function CrEmailToggle({ cr, label = "Client email confirmation received (no email = no work)" }) {
  return (
    <button type="button" className="inline-check" onClick={() => withCtx(crmActions.crEmailToggled, { crId: cr.id })}>
      <span className={`inline-check__box${cr.email ? " is-on" : ""}`}>{cr.email ? "✓" : ""}</span>
      {label}
    </button>
  );
}
