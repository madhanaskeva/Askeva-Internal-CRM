import { DatePicker } from "antd";
import dayjs from "dayjs";
import CheckToggle from "../common/CheckToggle";
import Pill from "../common/Pill";
import { useDispatch } from "react-redux";
import { crmActions } from "../../redux/slices/crmSlice";
import { modalOpened } from "../../redux/slices/uiSlice";
import { withCtx } from "../../features/actions/context";
import { cx } from "../../utils/cx";

/** Index of M7 ("Final payment & handover") — its target is the project deadline. */
const FINAL_MS = 6;

const dotTone = (m) => (m.done ? "green" : m.over ? "danger" : "white");

/**
 * Milestones M1–M7 of one project. Shared by the Deadlines page and Project detail.
 * @param {object} row  buildDeadlineRow(...) — uses id, deadlineIso, milestones
 * @param {"rows"|"tiles"} variant
 *   rows  — project detail: check toggle + editable target date + actual/slip
 *   tiles — deadlines page: 7-column tiles, whole tile toggles done
 */
export default function MilestoneList({ row, variant = "rows" }) {
  const dispatch = useDispatch();
  const projectId = row.id;

  const toggle = (index) => withCtx(crmActions.milestoneToggled, { projectId, index });

  // Original setTarget: M7 never changes directly — it opens a deadline revision request.
  const setTarget = (index, date) => {
    const v = date ? date.format("YYYY-MM-DD") : "";
    if (!v) return;
    if (index === FINAL_MS) {
      if (v !== row.deadlineIso) dispatch(modalOpened({ kind: "revise", extra: { projectId, to: v } }));
      return;
    }
    withCtx(crmActions.milestoneTargetSet, { projectId, index, target: v });
  };

  if (variant === "tiles") {
    return (
      <div className="dl-ms-tiles">
        {row.milestones.map((m, i) => (
          <button key={m.id} type="button" title="Toggle done" className={cx("dl-ms-tile", `tone-${m.rowTone}`)} onClick={() => toggle(i)}>
            <Pill tone={dotTone(m)} className="dl-ms-tile__dot">{m.id}</Pill>
            <span className="dl-ms-tile__name">{m.name}</span>
            <span className="fs-10 text-muted">{m.targetLabel}</span>
            <span className={`fs-10 fw-600 text-${m.actualColor}`}>{m.actualLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="stack gap-6">
      {row.milestones.map((m, i) => (
        <div key={m.id} className={cx("dl-ms-row", `tone-${m.rowTone}`)}>
          <CheckToggle checked={m.done} onChange={() => toggle(i)} title="Toggle done" />
          <span className="font-mono fs-10 text-ink">{m.id}</span>
          <span className="fw-600 text-ink dl-ms-row__name">{m.name}</span>
          <DatePicker
            size="small"
            className="brand-input dl-ms-row__date"
            value={m.target ? dayjs(m.target) : null}
            format="DD-MM-YYYY"
            allowClear={false}
            onChange={(d) => setTarget(i, d)}
          />
          <span className={`dl-ms-row__actual text-${m.actualColor}`}>
            {m.actualLabel} {m.slipLabel}
          </span>
        </div>
      ))}
    </div>
  );
}
