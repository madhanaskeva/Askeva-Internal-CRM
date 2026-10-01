import { DatePicker } from "antd";
import dayjs from "dayjs";
import CheckToggle from "../../components/common/CheckToggle";
import Pill from "../../components/common/Pill";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { useAction } from "../../app/useCrm";
import { setMilestoneTarget, toggleMilestone } from "../../utils/entities/projectUtils";

/** Index of M7 ("Final payment & handover") — its target is the project deadline. */
const FINAL_MS = 6;

const dotTone = (m) => (m.done ? "green" : m.over ? "danger" : "white");

/**
 * Milestones M1–M7 of one project. Shared by the Deadlines page and Project detail.
 * Sequential locking rule:
 * - Active milestone is the first uncompleted milestone.
 * - Only activeIdx and activeIdx - 1 (the immediately preceding completed milestone) are editable.
 * - Older completed milestones (< activeIdx - 1) and upcoming milestones (> activeIdx) are locked.
 */
export default function MilestoneList({ row, variant = "rows" }) {
  const dispatch = useDispatch();
  const run = useAction();
  const projectId = row.id;

  const firstUncompletedIdx = row.milestones.findIndex((m) => !m.done);
  const activeIdx = firstUncompletedIdx === -1 ? row.milestones.length - 1 : firstUncompletedIdx;

  const toggle = (index) => run(toggleMilestone, { projectId, index });

  // Original setTarget: M7 never changes directly — it opens a deadline revision request.
  const setTarget = (index, date) => {
    const v = date ? date.format("YYYY-MM-DD") : "";
    if (!v) return;
    if (index === FINAL_MS) {
      if (v !== row.deadlineIso) dispatch(modalOpened({ kind: "revise", extra: { projectId, to: v } }));
      return;
    }
    run(setMilestoneTarget, { projectId, index, target: v });
  };

  if (variant === "tiles") {
    return (
      <div className="dl-ms-tiles">
        {row.milestones.map((m, i) => {
          const isEditable = i === activeIdx || i === activeIdx - 1;
          const isLocked = !isEditable;

          return (
            <div
              key={m.id}
              className={cx("dl-ms-tile", `tone-${m.rowTone}`, isLocked && "is-locked")}
              onClick={() => !isLocked && toggle(i)}
              title={isLocked ? "Milestone is locked" : "Click card to toggle completion. Click date to edit target date."}
              style={{ cursor: isLocked ? "not-allowed" : "pointer", opacity: isLocked ? 0.65 : 1 }}
            >
              <div className="row row--between items-center w-full gap-4">
                <Pill tone={dotTone(m)} className="dl-ms-tile__dot">
                  {m.id}
                </Pill>
                <div onClick={(e) => e.stopPropagation()} title={isLocked ? "Milestone is locked" : "Edit target date"}>
                  <DatePicker
                    size="small"
                    variant="borderless"
                    className="dl-ms-tile__date-picker"
                    value={m.target ? dayjs(m.target) : null}
                    format="DD MMM"
                    allowClear={false}
                    disabled={isLocked}
                    onChange={(d) => setTarget(i, d)}
                  />
                </div>
              </div>
              <span className="dl-ms-tile__name">{m.name}</span>
              <span className={`fs-10 fw-600 text-${m.actualColor}`}>{m.actualLabel}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="stack gap-6">
      {row.milestones.map((m, i) => {
        const isEditable = i === activeIdx || i === activeIdx - 1;
        const isLocked = !isEditable;

        return (
          <div key={m.id} className={cx("dl-ms-row", `tone-${m.rowTone}`, isLocked && "is-locked")} style={{ opacity: isLocked ? 0.75 : 1 }}>
            <CheckToggle
              checked={m.done}
              onChange={() => !isLocked && toggle(i)}
              disabled={isLocked}
              title={isLocked ? "Milestone is locked" : "Toggle done"}
            />
            <span className="font-mono fs-10 text-ink">{m.id}</span>
            <span className="fw-600 text-ink dl-ms-row__name">{m.name}</span>
            <DatePicker
              size="small"
              className="brand-input dl-ms-row__date"
              value={m.target ? dayjs(m.target) : null}
              format="DD-MM-YYYY"
              allowClear={false}
              disabled={isLocked}
              onChange={(d) => setTarget(i, d)}
            />
            <span className={`dl-ms-row__actual text-${m.actualColor}`}>
              {m.actualLabel} {m.slipLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
