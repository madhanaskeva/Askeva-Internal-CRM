import { Input, Modal } from "antd";
import { useState } from "react";
import Card from "../../components/common/Card";
import { COMPLETED_STAGE, GATES, STAGES } from "../../constants/crm";
import { useDispatch, useSelector } from "react-redux";
import { selectStrict } from "../../redux/selectors";
import { crmActions } from "../../redux/slices/crmSlice";
import { toastShown } from "../../redux/slices/uiSlice";
import { withCtx } from "../../utils/actions/context";
import { cx } from "../../utils/cx";
import { fmt } from "../../utils/date";

/**
 * Dark stage-gate card: checklist for the current SOP stage, advance / override,
 * on-hold toggle (reason captured in a modal — the original used window.prompt).
 */
export default function StageGateCard({ p }) {
  const dispatch = useDispatch();
  const strict = useSelector(selectStrict);
  const [holdOpen, setHoldOpen] = useState(false);
  const [reason, setReason] = useState("");

  const n = p.stage;
  const items = GATES[n].items;
  const isOn = (k) => !!(p.gates[n] && p.gates[n][k]);
  const doneCount = items.filter(([k]) => isOn(k)).length;
  const gateOk = !items.length || items.every(([k]) => isOn(k));
  const locked = n >= COMPLETED_STAGE || (strict && !gateOk);
  const nextLabel = `${n + 1} · ${STAGES[n + 1]}`;
  const advLabel = n >= COMPLETED_STAGE ? "Completed" : gateOk || strict ? `Advance to ${nextLabel}` : `Override gate → ${nextLabel}`;
  const advTone = locked ? "locked" : gateOk ? "lime" : "danger";
  const progress = items.length ? `${doneCount}/${items.length} complete${gateOk ? " — gate open" : strict ? " — gate locked" : " (gates not enforced)"}` : "";

  const toggleGate = (key) => withCtx(crmActions.gateToggled, { projectId: p.id, stage: n, key });
  const advance = () => !locked && withCtx(crmActions.stageAdvanced, { projectId: p.id });

  const toggleHold = () => {
    if (p.onHold) withCtx(crmActions.holdSet, { projectId: p.id, onHold: false });
    else {
      setReason("");
      setHoldOpen(true);
    }
  };
  const confirmHold = () => {
    const r = reason.trim();
    if (!r) {
      dispatch(toastShown("A reason is required to put the project on hold."));
      return;
    }
    withCtx(crmActions.holdSet, { projectId: p.id, onHold: true, reason: r });
    setHoldOpen(false);
  };

  return (
    <Card tone="ink800" className="stack gap-12 pd-gate">
      <div className="label-caps text-lime">Stage gate · {n} · {STAGES[n]}</div>
      <div className="fs-12-5">{GATES[n].hint}</div>
      <div className="stack gap-6">
        {items.map(([k, label]) => (
          <button key={k} type="button" className="pd-gate__item" onClick={() => toggleGate(k)}>
            <span className={cx("pd-gate__box", isOn(k) && "is-on")}>{isOn(k) ? "✓" : ""}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {(p.overrides || []).length > 0 && (
        <div className="stack gap-4 pd-gate__audit">
          <div className="pd-gate__audit-title">Gate override audit</div>
          {p.overrides.slice().reverse().map((o, i) => (
            <div key={i} className="fs-11">
              <span className="mono-meta text-meta">{fmt(o.date)}</span> · Stage {o.stage} → {o.stage + 1} advanced with gate incomplete: {o.missing.join("; ")}
            </div>
          ))}
        </div>
      )}

      <div className="row row--wrap gap-10 mt-4">
        <button type="button" className={`pd-gate__advance pd-gate__advance--${advTone}`} disabled={locked} onClick={advance}>
          {advLabel}
        </button>
        {p.onHold && <div className="pd-gate__hold-reason">On hold · {p.holdReason}</div>}
        <button type="button" className="pd-gate__hold" onClick={toggleHold}>
          {p.onHold ? "Resume project" : "Put on hold"}
        </button>
        <span className="fs-11 text-meta">{progress}</span>
      </div>

      <Modal
        open={holdOpen}
        title="Put on hold"
        onCancel={() => setHoldOpen(false)}
        onOk={confirmHold}
        okText="Put on hold"
        rootClassName="brand-modal"
        classNames={{ mask: "brand-mask" }}
        okButtonProps={{ className: "btn-pill tone-danger" }}
        cancelButtonProps={{ className: "btn-pill tone-white" }}
        destroyOnHidden
      >
        <div className="stack gap-8">
          <label className="label-caps fw-700 text-ink" htmlFor="hold-reason">Reason for putting {p.code} on hold</label>
          <Input id="hold-reason" className="brand-input" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} onPressEnter={confirmHold} />
        </div>
      </Modal>
    </Card>
  );
}
