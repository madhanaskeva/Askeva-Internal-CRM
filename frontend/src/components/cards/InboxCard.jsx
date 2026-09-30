import { Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { actionNoteChanged, taskOpened } from "../../redux/slices/uiSlice";
import { acceptTask, declineTask } from "../../utils/actions/taskActions";
import Pill from "../common/Pill";
import PillButton from "../common/PillButton";

/**
 * A new allocation waiting for the developer's acceptance (Inbox + My work).
 * The decline reason uses the shared action note, exactly like the original.
 * `t` is a mapTask() view-model with an extra `ref` line.
 */
export default function InboxCard({ t }) {
  const dispatch = useDispatch();
  const note = useSelector((s) => s.ui.actionNote);
  return (
    <div className="inbox-card stack gap-8">
      <div className="row row--between row--wrap gap-8">
        <span className="mono-meta">{t.project} · {t.stage} · assigned {t.assignedOn} by {t.assignedBy}</span>
        <Pill size="xs" tone={t.acceptTone}>{t.acceptLabel}</Pill>
      </div>
      <button type="button" className="link-block inbox-card__title" onClick={() => dispatch(taskOpened(t.id))}>{t.title}</button>
      <div className="row row--wrap gap-10 fs-11 text-body">
        <span>Due <strong className={`text-${t.dueColor}`}>{t.due}</strong> (set by PC)</span>
        <Pill size="xs" tone={t.priorityTone}>{t.priority}</Pill>
      </div>
      {t.handoverPending && <div className="dashed-note">Handed over · {t.handoverLabel} — {t.handoverNote}</div>}
      <div className="meta">References · {t.ref}</div>
      <div className="row row--wrap gap-6">
        <PillButton size="sm" tone="green" className="inbox-card__accept" onClick={() => acceptTask(t.id)}>Accept</PillButton>
        <Input
          size="small"
          className="brand-input input-pill tone-paper inbox-card__reason"
          value={note}
          placeholder="Reason to decline (mandatory)…"
          onChange={(e) => dispatch(actionNoteChanged(e.target.value))}
        />
        <PillButton size="sm" dangerText onClick={() => declineTask(t.id)}>Decline</PillButton>
      </div>
    </div>
  );
}
