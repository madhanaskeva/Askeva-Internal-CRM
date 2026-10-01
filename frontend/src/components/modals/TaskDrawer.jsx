import { Drawer, Select } from "antd";
import { ASSIGNEE_BASE, MANAGERS, RELEASE_STATE_TEXT, ROLE_LABEL, TERMINAL, TS_LABEL } from "../../data";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { actionNoteChanged, taskClosed } from "../../redux/slices/uiSlice";
import { requestStaging } from "../../utils/actions/releaseActions";
import {
  acceptTask, ackHandover, declineTask, forceCloseTask, handOverTask, moveBug, moveTask, reassignTask, toggleBlock,
} from "../../utils/actions/taskActions";
import { fmt } from "../../utils/helpers/date";
import { canMove, isDone, roleFor, taskTrack, trackOf, transitionsFor } from "../../utils/domain/tasks";
import { severityTone } from "../../utils/domain/tones";
import { mapTask } from "../../utils/domain/views";
import Card from "../common/Card";
import NoteInput from "../common/NoteInput";
import Pill from "../common/Pill";
import PillButton from "../common/PillButton";
import { useAction, useData, useStrict } from "../../app/useCrm";

const historyChange = (h) =>
  h.from && h.from !== h.to ? `${TS_LABEL[h.from]} → ${TS_LABEL[h.to]}`
    : /^ACCEPTED/.test(h.note || "") ? "Accepted"
    : /^DECLINED/.test(h.note || "") ? "Declined"
    : /^HANDOVER ACK/.test(h.note || "") ? "Handover acknowledged"
    : /^HANDOVER/.test(h.note || "") ? "Handed over"
    : h.from ? TS_LABEL[h.to] : "Created";

const historyColor = (note = "") =>
  /^BLOCKED|^OVERRIDE|^DECLINED/.test(note) ? "danger" : /^ACCEPTED|^HANDOVER/.test(note) ? "green" : "ink";

/** Task drawer — opened from anywhere with `dispatch(taskOpened(taskId))`. */
export default function TaskDrawer() {
  const taskId = useSelector((s) => s.ui.taskId);
  const data = useData();
  const task = taskId ? data.tasks.find((t) => t.id === taskId) : null;
  const dispatch = useDispatch();
  return (
    <Drawer
      open={!!task}
      onClose={() => dispatch(taskClosed())}
      placement="right"
      size={560}
      closable={false}
      rootClassName="brand-drawer"
      classNames={{ mask: "brand-mask" }}
      destroyOnHidden
    >
      {task && <TaskDrawerBody t={task} data={data} />}
    </Drawer>
  );
}

function TaskDrawerBody({ t, data }) {
  const dispatch = useDispatch();
  const run = useAction();
  const role = useSelector(selectRole);
  const strict = useStrict();
  const note = useSelector((s) => s.ui.actionNote);
  const m = mapTask(t, data);
  const project = data.projects.find((p) => p.id === t.projectId) || {};
  const flowRole = roleFor(role, t);
  const isManager = MANAGERS.includes(role);
  const bugs = data.bugs.filter((b) => b.taskId === t.id);

  const actions = transitionsFor(t).map(([to, who]) => ({ to, who: who.join(" / "), ok: canMove(role, t, to) }));
  const stagedIn = (() => {
    const r = (data.releases || []).filter((x) => x.tasks.includes(t.id)).sort((a, b) => b.requestedOn.localeCompare(a.requestedOn))[0];
    if (!r) return "";
    const st = r.status === "deployed" ? "deployed " + fmt(r.deployedOn) : RELEASE_STATE_TEXT[r.status];
    return `${r.id} · ${r.version} · ${r.env} · ${st}`;
  })();
  const canRequestStaging =
    t.status === "devdone" && flowRole === "Assignee" &&
    !(data.releases || []).some((r) => r.tasks.includes(t.id) && r.env === "staging" && ["requested", "deployed"].includes(r.status));
  const canHandOver = flowRole === "Assignee" && t.acceptance === "accepted" && !isDone(t);
  const handOverOpts = (data.staff || [])
    .filter((s) => s.status === "Active" && s.name !== t.assignee && trackOf({ assignee: s.name }) === taskTrack(t))
    .map((s) => ({ value: s.name, label: s.name }));
  const assigneeOpts = [...new Set([...ASSIGNEE_BASE, ...(data.staff || []).map((s) => s.name)])].map((v) => ({ value: v, label: v }));

  const canFix = ["Frontend", "Backend", "PM"].includes(role);
  const canTest = role === "Tester" || role === "PM";

  return (
    <>
      <div className="row row--between row--top gap-12">
        <div>
          <div className="mono-meta">{project.code} · {m.project} · {t.stage}</div>
          <h2 className="drawer-title">{t.title}</h2>
        </div>
        <button type="button" className="icon-circle-btn" aria-label="Close" onClick={() => dispatch(taskClosed())}>✕</button>
      </div>

      <div className="row row--wrap gap-6">
        <Pill size="md" bold tone={m.statusTone}>{TS_LABEL[t.status]}</Pill>
        {m.blocked && <Pill size="md" tone="danger">BLOCKED</Pill>}
        {m.overridden && <Pill size="md" tone="lime">CLOSED BY OVERRIDE</Pill>}
        {t.acceptance && <Pill size="md" tone={m.acceptTone}>{m.acceptLabel}</Pill>}
        <Pill size="md" tone={m.priorityTone}>{m.priority}</Pill>
        <span className={`fs-11 text-${m.dueColor}`}>due {m.due} {m.overdueTag}</span>
      </div>

      <Card size="md" className="kv kv--drawer">
        <span>Owner (accountable)</span>
        <strong className="text-ink">{m.owner} · created by {t.createdBy || "PC"}</strong>
        <span>Assignee (doing)</span>
        <div className="row row--wrap gap-8">
          <strong className="text-ink">{t.assignee}</strong>
          {isManager ? (
            <Select
              key={t.assignee}
              size="small"
              className="brand-input brand-select-sm"
              defaultValue={t.assignee}
              options={assigneeOpts}
              onChange={(v) => run(reassignTask, t.id, v)}
              popupMatchSelectWidth={false}
              showSearch
            />
          ) : (
            <span className="fs-11 text-muted">only Owner / PM can reassign</span>
          )}
        </div>
        <span>Record</span>
        <span>{`${m.worked} day(s) worked · completed ${m.completedOn} · closed ${m.closedOn}${m.delayLabel ? " · " + m.delayLabel : ""}`}</span>
        {t.acceptance && (
          <>
            <span>Allocation</span>
            <span>assigned {m.assignedOn} by {m.assignedBy} · {m.acceptLabel}</span>
          </>
        )}
        {m.handoverPending && (
          <>
            <span>Handover</span>
            <div className="row row--wrap gap-8">
              <span>{m.handoverLabel} — {m.handoverNote}</span>
              {isManager && <PillButton size="xxs" tone="ink" onClick={() => run(ackHandover, t.id)}>PC acknowledge</PillButton>}
            </div>
          </>
        )}
      </Card>

      {t.acceptance === "pending" && flowRole === "Assignee" && (
        <Card size="md" tone="lime" className="stack gap-8">
          <div className="label-caps fw-700">This task is waiting for your acceptance</div>
          <div className="fs-11">Accept to start work (due date stays as set by PC) or decline with a reason — it then returns to the PC unassigned.</div>
          <div className="row row--wrap gap-6">
            <PillButton size="sm" tone="green" onClick={() => run(acceptTask, t.id)}>Accept</PillButton>
            <PillButton size="sm" dangerText onClick={() => run(declineTask, t.id)}>Decline (reason in note below)</PillButton>
          </div>
        </Card>
      )}

      {canRequestStaging && (
        <div className="row row--wrap gap-8">
          <PillButton size="sm" tone="ink" onClick={() => run(requestStaging, t.id)}>Request staging deploy</PillButton>
          <span className="meta">Goes to DevOps queue · tester tests on staging</span>
        </div>
      )}
      {stagedIn && <div className="dashed-note">Deploy · {stagedIn}</div>}

      {canHandOver && (
        <div className="row row--wrap gap-8 fs-11 text-body">
          <span>Hand over to a colleague (same track, note required):</span>
          <Select
            key={t.assignee}
            size="small"
            className="brand-input brand-select-sm"
            placeholder="Choose…"
            options={handOverOpts}
            onChange={(v) => run(handOverTask, t.id, v)}
            popupMatchSelectWidth={false}
          />
          <span className="fs-11 text-muted">PC is notified and must acknowledge; the colleague must accept.</span>
        </div>
      )}

      <div className="stack gap-8">
        <div className="label-caps fw-700 text-ink">Actions as {ROLE_LABEL[role]}</div>
        <NoteInput
          value={note}
          onChange={(v) => dispatch(actionNoteChanged(v))}
          placeholder="Note for this action (mandatory for Block; recorded in history)"
        />
        <div className="row row--wrap gap-6">
          {actions.map((a) => (
            <PillButton
              key={a.to}
              size="sm"
              title={`Allowed: ${a.who}`}
              tone={a.ok ? (a.to === "failed" ? "danger" : "lime") : "muted"}
              className={a.ok ? "" : "is-not-allowed"}
              onClick={() => run(moveTask, t.id, a.to, note)}
            >
              {a.to === "failed" ? "Fail → raise bug" : "→ " + TS_LABEL[a.to]} <span className="btn-sub">· {a.who}</span>
            </PillButton>
          ))}
          {t.status === "closed" ? (
            <span className="fs-11 text-muted">Closed — no further transitions.</span>
          ) : (
            <PillButton size="sm" onClick={() => run(toggleBlock, t.id)}>{t.blocked ? "Unblock" : "Block (reason required)"}</PillButton>
          )}
          {!TERMINAL.includes(t.status) && isManager && (
            <PillButton size="xs" tone="transparent" dashed dangerText onClick={() => run(forceCloseTask, t.id)}>
              {strict ? "Force close (locked by strictGates)" : "Force close — override"}
            </PillButton>
          )}
        </div>
        <div className="meta">
          Flow: To do → In progress → Dev completed → Testing → Passed / Failed → Rework → … → Closed. Only the Tester can Pass or Fail; Close only after Passed. Completion dates are stamped by the system — no backdating.
        </div>
      </div>

      {bugs.length > 0 && (
        <div className="stack gap-8">
          <div className="label-caps fw-700 text-ink">Bugs</div>
          {bugs.map((b) => (
            <Card key={b.id} size="sm" className="stack gap-6">
              <div className="row row--wrap gap-6">
                <span className="font-mono fs-10 fw-700 text-ink">{b.id}</span>
                <Pill size="xs" tone={severityTone(b.severity)}>{b.severity}</Pill>
                <Pill size="xs" tone={b.status === "Verified" ? "green" : b.status === "Open" ? "danger" : "lime"}>{b.status}</Pill>
                <span className="fs-11 text-muted">
                  raised {fmt(b.raised)}{b.fixed ? " · fixed " + fmt(b.fixed) : ""}{b.retest ? " · retest " + fmt(b.retest) : ""}
                </span>
              </div>
              <div className="fw-600 text-ink fs-12-5">{b.desc}</div>
              <div className="meta">
                Evidence: {b.evidence} · dev {b.developer} · tester {b.tester} {b.result && <strong className="text-ink">· {b.result}</strong>}
              </div>
              <div className="row row--wrap gap-6">
                {b.status === "Open" && <PillButton size="xs" tone="lime" onClick={() => run(moveBug, b.id, "Fixed")}>Mark Fixed · Developer</PillButton>}
                {b.status === "Open" && canFix && <PillButton size="xs" onClick={() => run(moveBug, b.id, "Rejected")}>Reject — not a bug (reason) · Developer</PillButton>}
                {b.status === "Rejected" && canTest && (
                  <>
                    <PillButton size="xs" tone="ink" onClick={() => run(moveBug, b.id, "NotABug")}>Accept · Not a bug · Tester</PillButton>
                    <PillButton size="xs" tone="danger" onClick={() => run(moveBug, b.id, "Reopened")}>Reopen · Tester</PillButton>
                  </>
                )}
                {b.status === "Fixed" && <PillButton size="xs" tone="lime" onClick={() => run(moveBug, b.id, "Retest")}>Start Retest · Tester</PillButton>}
                {b.status === "Retest" && (
                  <>
                    <PillButton size="xs" tone="green" onClick={() => run(moveBug, b.id, "Verified")}>Verified · Tester</PillButton>
                    <PillButton size="xs" tone="danger" onClick={() => run(moveBug, b.id, "Reopened")}>Reopen · Tester</PillButton>
                  </>
                )}
              </div>
              <div className="stack gap-4 divider-dashed-top">
                {(b.history || []).slice().reverse().map((h, i) => (
                  <div key={i} className="fs-11 text-body">
                    <span className="mono-meta">{fmt(h.date)}</span> · {`${h.actor} (${h.role}) → ${h.to}${h.note ? " · " + h.note : ""}`}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="stack gap-6">
        <div className="label-caps fw-700 text-ink">History · append-only</div>
        {(t.history || []).slice().reverse().map((h, i) => (
          <div key={i} className="history-row">
            <span className="mono-meta">{fmt(h.date)}</span>
            <div>
              <span className={`fw-600 text-${historyColor(h.note)}`}>{historyChange(h)}</span>{" "}
              <span className="text-muted">· {h.actor} ({h.role})</span>
              {h.note && <div className="fs-11 text-body">{h.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
