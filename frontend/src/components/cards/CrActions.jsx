import PillButton from "../common/PillButton";
import { useAction } from "../../app/useCrm";
import { advanceChangeRequest, toggleCrEmail } from "../../utils/entities/changeRequestUtils";

/** "→ Next status" button for a CR row (disabled when locked). `cr` is a mapCr() view-model. */
export function CrNextButton({ cr }) {
  const run = useAction();
  return (
    <PillButton
      size="xs"
      tone={cr.locked ? "muted" : "lime"}
      disabled={cr.locked}
      onClick={() => run(advanceChangeRequest, { crId: cr.id })}
    >
      {cr.nextLabel}
    </PillButton>
  );
}

/** Checkbox line for "client email confirmation received" on quoted CRs. */
export function CrEmailToggle({ cr, label = "Client email confirmation received (no email = no work)" }) {
  const run = useAction();
  return (
    <button type="button" className="inline-check" onClick={() => run(toggleCrEmail, { crId: cr.id })}>
      <span className={`inline-check__box${cr.email ? " is-on" : ""}`}>{cr.email ? "✓" : ""}</span>
      {label}
    </button>
  );
}
