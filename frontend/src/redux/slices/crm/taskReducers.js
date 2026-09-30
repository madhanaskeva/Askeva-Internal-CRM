// Task + bug reducers. Permission checks live in utils/actions/taskActions.js;
// these reducers only apply the already-validated change.
import { needsAccept, trackOf } from "../../../utils/domain/tasks";
import { findBug, findTask, logAction } from "./helpers";

export const taskReducers = {
  /** payload: { ctx, taskId, to, note, flowRole } */
  taskMoved(s, { payload: { ctx, taskId, to, note, flowRole } }) {
    const x = findTask(s, taskId);
    const from = x.status;
    x.history.push({ date: ctx.date, time: ctx.time, actor: ctx.actor, role: flowRole, from, to, note: note || "" });
    x.status = to;
    if (to === "devdone") x.completedOn = ctx.date;
    if (to === "closed") x.closedOn = ctx.date;
    if (to === "doing" || to === "rework") x.blocked = false;
    logAction(s, ctx, null, { projectId: x.projectId, taskId, action: "TASK_" + to.toUpperCase(), from, to, reason: note || "" });
  },

  /** payload: { ctx, taskId, note, flowRole } */
  taskForceClosed(s, { payload: { ctx, taskId, note, flowRole } }) {
    const x = findTask(s, taskId);
    x.history.push({ date: ctx.date, actor: ctx.actor, role: flowRole, from: x.status, to: "closed", note: "OVERRIDE — closed without tester verification. " + (note || "") });
    x.status = "closed";
    x.closedOn = ctx.date;
    x.overridden = true;
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId, note, flowRole } */
  taskBlockToggled(s, { payload: { ctx, taskId, note, flowRole } }) {
    const x = findTask(s, taskId);
    x.blocked = !x.blocked;
    x.history.push({ date: ctx.date, actor: ctx.actor, role: flowRole, from: x.status, to: x.status, note: (x.blocked ? "BLOCKED — " : "UNBLOCKED — ") + note });
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId, to } */
  taskReassigned(s, { payload: { ctx, taskId, to } }) {
    const x = findTask(s, taskId);
    x.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, from: x.status, to: x.status, note: `Reassigned ${x.assignee} → ${to}` });
    x.assignee = to;
    x.track = trackOf(x);
    if (x.handover) x.handover.ack = true;
    if (needsAccept(x)) {
      x.acceptance = "pending";
      x.assignedOn = ctx.date;
      x.assignedBy = ctx.actor;
      x.acceptedOn = null;
      x.declinedBy = null;
    } else {
      x.acceptance = null;
    }
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId, note } */
  taskAccepted(s, { payload: { ctx, taskId, note } }) {
    const x = findTask(s, taskId);
    x.acceptance = "accepted";
    x.acceptedOn = ctx.date;
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: "ACCEPTED — task accepted" + (note ? " · " + note : "") });
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId, note } */
  taskDeclined(s, { payload: { ctx, taskId, note } }) {
    const x = findTask(s, taskId);
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: "DECLINED — " + note });
    x.acceptance = "declined";
    x.declinedBy = x.assignee;
    x.assignee = "Unassigned";
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId, to, note } */
  taskHandedOver(s, { payload: { ctx, taskId, to, note } }) {
    const x = findTask(s, taskId);
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: `HANDOVER — ${x.assignee} → ${to} · ${note}` });
    x.handover = { from: x.assignee, to, date: ctx.date, note, ack: false };
    x.assignee = to;
    x.acceptance = "pending";
    x.assignedOn = ctx.date;
    x.assignedBy = ctx.actor;
    x.acceptedOn = null;
    logAction(s, ctx);
  },

  /** payload: { ctx, taskId } */
  handoverAcknowledged(s, { payload: { ctx, taskId } }) {
    const x = findTask(s, taskId);
    if (x.handover) {
      x.handover.ack = true;
      x.handover.ackOn = ctx.date;
      x.handover.ackBy = ctx.actor;
    }
    x.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, from: x.status, to: x.status, note: "HANDOVER ACKNOWLEDGED by " + ctx.role });
    logAction(s, ctx);
  },

  /** payload: { ctx, task } — a fully built task record. */
  taskAdded(s, { payload: { ctx, task } }) {
    s.tasks.push(task);
    logAction(s, ctx);
  },

  /** payload: { ctx, bugId, to, note } */
  bugMoved(s, { payload: { ctx, bugId, to, note } }) {
    const x = findBug(s, bugId);
    const from = x.status;
    x.history.push({ date: ctx.date, time: ctx.time, actor: ctx.actor, role: ctx.role, to, note: note || "" });
    if (to === "Fixed") { x.fixed = ctx.date; x.fixedTime = ctx.time; }
    if (to === "Retest") { x.retestTime = ctx.time; x.retest = ctx.date; }
    if (to === "Verified") x.closedTime = ctx.time;
    if (to === "Verified") {
      x.result = "Passed retest";
      x.status = "Verified";
      x.closedOn = ctx.date;
    } else if (to === "Reopened") {
      x.result = "Failed retest";
      x.status = "Open";
    } else if (to === "NotABug") {
      x.result = "Rejected — not a bug (tester agreed)";
      x.status = "Verified";
      x.notABug = true;
      x.closedOn = ctx.date;
    } else {
      x.status = to;
    }
    logAction(s, ctx, null, { projectId: x.projectId, taskId: x.taskId, bugId, action: "BUG_" + to.toUpperCase(), from, to, reason: note || "", severity: x.severity });
  },

  /** Tester fails a task by raising a linked bug. payload: { ctx, taskId, projectId, form } */
  bugRaised(s, { payload: { ctx, taskId, projectId, form } }) {
    const id = "BUG-" + String(s.bugs.length + 1).padStart(3, "0");
    s.bugs.push({
      id, taskId, projectId, severity: form.severity, module: form.module || "General", desc: form.desc, evidence: form.evidence,
      developer: form.developer, tester: ctx.actor, status: "Open", raised: ctx.date, raisedTime: ctx.time, fixed: null, retest: null, result: "",
      history: [{ time: ctx.time, date: ctx.date, actor: ctx.actor, role: ctx.role, to: "Open", note: "Raised" }],
    });
    const x = findTask(s, taskId);
    if (x) {
      x.history.push({ date: ctx.date, actor: ctx.actor, role: "Tester", from: x.status, to: "failed", note: `${id} · ${form.desc}` });
      x.status = "failed";
    }
    logAction(s, ctx, null, { projectId, taskId, action: "BUG_RAISED", severity: form.severity, evidence: form.evidence, to: "Open" });
  },
};
