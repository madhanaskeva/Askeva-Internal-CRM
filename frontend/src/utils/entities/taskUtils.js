// Tasks. Permission checks live in utils/actions/taskActions.js; these
// functions only apply an already-validated change.
import { STORAGE_KEYS, tasks as defaultTasks } from "../../data";
import { createCollection } from "../storage/collection";
import { isDone, needsAccept, trackOf } from "../domain/tasks";
import { addLog } from "./syslogUtils";

const tasks = createCollection(STORAGE_KEYS.TASKS, defaultTasks);

export const getTasks = tasks.getAll;
export const getTaskById = tasks.getById;
export const getOpenTasks = () => tasks.filter((t) => !isDone(t));
/** Is anyone still working on an open task assigned to `name`? */
export const hasOpenTasksFor = (name) => tasks.some((t) => t.assignee === name && !isDone(t));

/** Insert a task without an audit entry (used inside other logged changes). */
export const insertTask = (task) => tasks.add(task);

/** payload: { task } — a fully built task record. */
export function addTask(ctx, { task }) {
  insertTask(task);
  addLog(ctx);
}

export function deleteTask(ctx, { taskId }) {
  const x = getTaskById(taskId);
  tasks.remove(taskId);
  addLog(ctx, "Deleted task " + (x ? `${x.id} · ${x.title}` : taskId));
}

export function editTaskRecord(ctx, { taskId, updates }) {
  tasks.update(taskId, (t) => {
    Object.assign(t, updates);
    if (updates.assignee) t.track = trackOf(t);
  });
  addLog(ctx, "Updated task " + taskId);
}

/** Update one task: `updates` is an object or an updater fn (see collection.js). */
export const updateTask = (taskId, updates) => tasks.update(taskId, updates);

/** Close every open task linked to a release (deploy). */
export function closeTasksForRelease(ctx, releaseId, releaseLabel) {
  tasks.updateWhere(
    (t) => t.releaseId === releaseId && !isDone(t),
    (t) => {
      t.status = "closed";
      t.completedOn = ctx.date;
      t.closedOn = ctx.date;
      t.history.push({ date: ctx.date, actor: ctx.actor, role: "DevOps", from: "todo", to: "closed", note: "Closed by deploy of " + releaseLabel });
    },
  );
}

/** payload: { taskId, to, note, flowRole } */
export function moveTaskStatus(ctx, { taskId, to, note, flowRole }) {
  const x = getTaskById(taskId);
  const from = x.status;
  tasks.update(taskId, (t) => {
    t.history.push({ date: ctx.date, time: ctx.time, actor: ctx.actor, role: flowRole, from, to, note: note || "" });
    t.status = to;
    if (to === "devdone") t.completedOn = ctx.date;
    if (to === "closed") t.closedOn = ctx.date;
    if (to === "doing" || to === "rework") t.blocked = false;
  });
  addLog(ctx, null, { projectId: x.projectId, taskId, action: "TASK_" + to.toUpperCase(), from, to, reason: note || "" });
}

export function forceCloseTaskRecord(ctx, { taskId, note, flowRole }) {
  tasks.update(taskId, (x) => {
    x.history.push({ date: ctx.date, actor: ctx.actor, role: flowRole, from: x.status, to: "closed", note: "OVERRIDE — closed without tester verification. " + (note || "") });
    x.status = "closed";
    x.closedOn = ctx.date;
    x.overridden = true;
  });
  addLog(ctx);
}

export function toggleTaskBlock(ctx, { taskId, note, flowRole }) {
  tasks.update(taskId, (x) => {
    x.blocked = !x.blocked;
    x.history.push({ date: ctx.date, actor: ctx.actor, role: flowRole, from: x.status, to: x.status, note: (x.blocked ? "BLOCKED — " : "UNBLOCKED — ") + note });
  });
  addLog(ctx);
}

export function reassignTaskRecord(ctx, { taskId, to }) {
  tasks.update(taskId, (x) => {
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
  });
  addLog(ctx);
}

export function acceptTaskRecord(ctx, { taskId, note }) {
  tasks.update(taskId, (x) => {
    x.acceptance = "accepted";
    x.acceptedOn = ctx.date;
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: "ACCEPTED — task accepted" + (note ? " · " + note : "") });
  });
  addLog(ctx);
}

export function declineTaskRecord(ctx, { taskId, note }) {
  tasks.update(taskId, (x) => {
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: "DECLINED — " + note });
    x.acceptance = "declined";
    x.declinedBy = x.assignee;
    x.assignee = "Unassigned";
  });
  addLog(ctx);
}

export function handOverTaskRecord(ctx, { taskId, to, note }) {
  tasks.update(taskId, (x) => {
    x.history.push({ date: ctx.date, actor: ctx.actor, role: "Assignee", from: x.status, to: x.status, note: `HANDOVER — ${x.assignee} → ${to} · ${note}` });
    x.handover = { from: x.assignee, to, date: ctx.date, note, ack: false };
    x.assignee = to;
    x.acceptance = "pending";
    x.assignedOn = ctx.date;
    x.assignedBy = ctx.actor;
    x.acceptedOn = null;
  });
  addLog(ctx);
}

export function acknowledgeHandover(ctx, { taskId }) {
  tasks.update(taskId, (x) => {
    if (x.handover) {
      x.handover.ack = true;
      x.handover.ackOn = ctx.date;
      x.handover.ackBy = ctx.actor;
    }
    x.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, from: x.status, to: x.status, note: "HANDOVER ACKNOWLEDGED by " + ctx.role });
  });
  addLog(ctx);
}
