// Shared row view-models: mapTask / mapFollowup / mapCr — ported from the original
// renderVals helpers, with tone keys instead of inline colours.
import { CR_STATUSES, TS_LABEL } from "../../data";
import { TODAY, daysBetween, fmt } from "../helpers/date";
import { dueInfo, priorityTone, taskStatusTone } from "./tones";
import { isDone } from "./tasks";

const projectOf = (data, id) => data.projects.find((p) => p.id === id) || {};

/** Calendar days actively worked (doing/rework), excluding blocked spans. */
export function workedDays(t) {
  const h = (t.history || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  let days = 0;
  let active = null;
  let blocked = false;
  const working = (s) => ["doing", "rework"].includes(s);
  h.forEach((e) => {
    const isBlock = /^BLOCKED/.test(e.note || "");
    const isUnblock = /^UNBLOCKED/.test(e.note || "");
    if (active && (isBlock || !working(e.to) || (e.to !== e.from && !working(e.to)))) {
      if (!blocked) days += Math.max(1, daysBetween(e.date, active));
      active = null;
    }
    if (isBlock) blocked = true;
    if (isUnblock) {
      blocked = false;
      if (working(t.status) || working(e.to)) active = e.date;
    }
    if (working(e.to) && e.to !== e.from && !isBlock) active = e.date;
  });
  if (active && !blocked) days += Math.max(1, daysBetween(TODAY, active));
  return days;
}

export function mapTask(t, data) {
  const done = isDone(t);
  const di = dueInfo(t.due, done);
  const bugs = data.bugs.filter((b) => b.taskId === t.id);
  const delay = t.completedOn ? daysBetween(t.completedOn, t.due) : !done && di.over ? -di.dd : 0;
  const pending = t.acceptance === "pending";
  const late = pending && (t.assignedOn || TODAY) < TODAY;
  return {
    id: t.id,
    raw: t,
    projectId: t.projectId,
    title: t.title,
    assignee: t.assignee,
    owner: t.owner || "PC",
    due: fmt(t.due),
    stage: t.stage,
    project: projectOf(data, t.projectId).client,
    priority: t.priority,
    priorityTone: priorityTone(t.priority),
    status: TS_LABEL[t.status] || t.status,
    statusKey: t.status,
    statusTone: taskStatusTone(t.status),
    blocked: !!t.blocked,
    overridden: !!t.overridden,
    done,
    bugCount: bugs.length,
    openBugs: bugs.filter((b) => b.status !== "Verified").length,
    dueColor: di.color,
    overdue: di.over,
    overdueTag: di.over ? "· OVERDUE" : "",
    rowTone: done ? "cream" : t.blocked || di.over ? "rose" : "white",
    worked: workedDays(t),
    completedOn: t.completedOn ? fmt(t.completedOn) : "—",
    closedOn: t.closedOn ? fmt(t.closedOn) : "—",
    delay,
    delayLabel: delay > 0 ? `${delay}d late` : "",
    opsKind: t.opsKind || "",
    isSelf: !!t.selfCreated,
    acceptance: t.acceptance || "",
    isPendingAccept: pending,
    isUnassigned: t.assignee === "Unassigned",
    acceptLate: late,
    acceptLabel: pending ? (late ? "AWAITING ACCEPT · LATE" : "AWAITING ACCEPT") : t.acceptance === "declined" ? "DECLINED · UNASSIGNED" : t.acceptance === "accepted" ? "ACCEPTED" : "",
    acceptTone: pending ? (late ? "danger" : "lime") : t.acceptance === "declined" ? "danger" : "green",
    handoverPending: !!(t.handover && !t.handover.ack),
    handoverLabel: t.handover ? `${t.handover.from} → ${t.handover.to} · ${fmt(t.handover.date)}` : "",
    handoverNote: t.handover ? t.handover.note : "",
    assignedOn: t.assignedOn ? fmt(t.assignedOn) : "—",
    assignedBy: t.assignedBy || "PC",
  };
}

export function mapFollowup(f, data) {
  const done = f.status === "done";
  const di = dueInfo(f.due, done);
  const onUs = (f.court || "us") === "us";
  const p = projectOf(data, f.projectId);
  return {
    id: f.id,
    done,
    title: f.note || f.type,
    type: f.type,
    channel: f.channel,
    with: f.with,
    project: p.client,
    meta: `${p.client} · ${f.with} · ${f.channel}`,
    dueLabel: di.label,
    dueColor: di.color,
    rowTone: done ? "cream" : di.over ? "rose" : "white",
    courtLabel: onUs ? "Ball with us" : "Waiting on client",
    courtTone: onUs ? "ink" : "white",
    comments: (f.log || []).slice().reverse().map((l, i) => ({ key: i, date: fmt(l.date), text: l.text })),
  };
}

/**
 * CR row. `locked`: already approved, or next step is Approved without client email while strictGates is on.
 * @param {boolean} strict
 */
export function mapCr(c, data, strict) {
  const i = CR_STATUSES.indexOf(c.status);
  const approved = c.status === "Approved";
  const nextIsApprove = CR_STATUSES[i + 1] === "Approved";
  const locked = approved || c.status === "Rejected" || (nextIsApprove && !c.email && strict);
  const p = projectOf(data, c.projectId);
  const daysOn = (p.effortLog || []).filter((e) => e.crId === c.id).reduce((s, e) => s + e.days, 0);
  return {
    id: c.id,
    title: c.title,
    kind: c.kind,
    raised: fmt(c.raised),
    project: p.client,
    detail: `${c.cost} · ${c.timeline}`,
    status: c.status,
    statusTone: approved ? "green" : c.status === "Quoted" ? "lime" : "white",
    rowTone: approved ? "cream" : "white",
    needsEmail: c.status === "Quoted",
    email: !!c.email,
    overridden: !!c.overridden,
    daysOn,
    daysLabel: `${daysOn}d logged`,
    locked,
    nextLabel: approved ? "Closed" : c.status === "Rejected" ? "Rejected" : "→ " + CR_STATUSES[i + 1],
  };
}

/** Age in days since a follow-up/CR/etc. was raised (helper for alerts/labels). */
export const ageDays = (d) => daysBetween(TODAY, d);
