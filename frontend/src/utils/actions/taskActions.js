// Task + bug workflow rules — ported from moveTask / forceClose / toggleBlock /
// reassign / acceptTask / declineTask / handOver / ackHandover / moveBug.
// Each action validates against the current role and returns a result
// (see ./context.js); on success it writes through taskUtils / bugUtils.
import { BUG_FLOW, MANAGERS, TRANS, TS_LABEL } from "../../data";
import { getBugById, hasOpenBugs, moveBugStatus } from "../entities/bugUtils";
import { canMove, needsAccept, roleFor } from "../domain/tasks";
import { isStrict } from "../entities/ruleUtils";
import {
  acceptTaskRecord, acknowledgeHandover, declineTaskRecord, forceCloseTaskRecord, getTaskById, handOverTaskRecord,
  moveTaskStatus, reassignTaskRecord, toggleChecklistItemRecord, toggleTaskBlock,
} from "../entities/taskUtils";
import { done, refuse } from "./context";

export function moveTask(ctx, taskId, to, note = "") {
  const role = ctx.role;
  const t = getTaskById(taskId);
  if (!canMove(role, t, to, ctx.actor)) {
    const allowed = ((TRANS[t.status] || []).find(([s]) => s === to) || [[], []])[1].join(", ") || "nobody";
    return refuse(`${role} cannot move "${TS_LABEL[t.status]}" → "${TS_LABEL[to]}". Allowed: ${allowed}.`);
  }
  if (to === "doing" && needsAccept(t) && t.acceptance === "pending") return refuse("Accept the task first — it is still waiting in the Inbox.");
  if (t.assignee === "Unassigned") return refuse("Task is unassigned (declined). PC must assign a developer first.");
  if (to === "passed" && hasOpenBugs(t.id)) return refuse("Cannot pass: open bugs on this task must be Verified first.");
  // Failing a task always goes through the "raise bug" form.
  if (to === "failed") return refuse(undefined, { openModal: { kind: "bug", extra: { taskId: t.id, projectId: t.projectId, assignee: t.assignee } } });
  moveTaskStatus(ctx, { taskId, to, note, flowRole: roleFor(role, t, ctx.actor) });
  return done({ clearNote: true });
}

export function forceCloseTask(ctx, taskId) {
  if (isStrict()) return refuse("strictGates is on — a task can only be Closed after Tester Passed.");
  forceCloseTaskRecord(ctx, { taskId, note: ctx.note, flowRole: roleFor(ctx.role, getTaskById(taskId), ctx.actor) });
  return done({ clearNote: true });
}

export function toggleBlock(ctx, taskId, overrideNote) {
  const t = getTaskById(taskId);
  const note = (overrideNote !== undefined ? overrideNote : ctx.note || "").trim();
  if (!t.blocked && !note) return refuse("A reason is mandatory to block a task.");
  toggleTaskBlock(ctx, { taskId, note, flowRole: roleFor(ctx.role, t, ctx.actor) });
  return done({ clearNote: true });
}

export function reassignTask(ctx, taskId, to) {
  if (!MANAGERS.includes(ctx.role)) return refuse("Only the task Owner (PC) or PM can change the assignee. Ask the PC.");
  const t = getTaskById(taskId);
  if (!to || to === t.assignee) return refuse();
  reassignTaskRecord(ctx, { taskId, to });
  return done();
}

export function acceptTask(ctx, taskId) {
  if (roleFor(ctx.role, getTaskById(taskId), ctx.actor) !== "Assignee") return refuse("Only the assigned developer can accept this task.");
  acceptTaskRecord(ctx, { taskId, note: ctx.note });
  return done({ clearNote: true, message: "Accepted. Due date stays as set by the PC." });
}

export function declineTask(ctx, taskId) {
  if (roleFor(ctx.role, getTaskById(taskId), ctx.actor) !== "Assignee") return refuse("Only the assigned developer can decline this task.");
  const note = (ctx.note || "").trim();
  if (!note) return refuse("A reason is mandatory to decline a task.");
  declineTaskRecord(ctx, { taskId, note });
  return done({ clearNote: true, closeTask: true, message: "Declined. Task returned to the PC as Unassigned." });
}

export function handOverTask(ctx, taskId, to) {
  const t = getTaskById(taskId);
  if (roleFor(ctx.role, t, ctx.actor) !== "Assignee") return refuse("Only the current assignee can hand over a task.");
  if (!to || to === t.assignee) return refuse();
  const note = (ctx.note || "").trim();
  if (!note) return refuse("Add a note explaining the handover first.");
  handOverTaskRecord(ctx, { taskId, to, note });
  return done({ clearNote: true, message: `Handed over to ${to}. PC must acknowledge; ${to} must accept.` });
}

export function ackHandover(ctx, taskId) {
  if (!MANAGERS.includes(ctx.role)) return refuse("Only the PC (or PM) acknowledges handovers.");
  acknowledgeHandover(ctx, { taskId });
  return done();
}

/**
 * Bug lifecycle: Open → Fixed (dev) → Retest (tester) → Verified / Reopened (tester);
 * dev may Reject (reason required) → tester accepts (NotABug) or reopens.
 */
export function moveBug(ctx, bugId, to) {
  const note = ctx.note || "";
  const r0 = ctx.role;
  const r = r0 === "Frontend" || r0 === "Backend" ? "Developer" : r0;
  const b = getBugById(bugId);
  const rule = BUG_FLOW[b.status];
  if (to === "Verified" || to === "Reopened" || to === "NotABug") {
    if (!["Tester", "PM"].includes(r)) return refuse("Only the Tester can verify, reopen or close a bug.");
  } else if (to === "Rejected") {
    if (!["Developer", "PM"].includes(r)) return refuse("Only the Developer can reject a bug.");
    if (!note.trim()) return refuse("A reason is mandatory to reject a bug as not-a-bug.");
  } else if (!rule || rule[0] !== to || !rule[1].includes(r)) {
    return refuse(`${r0} cannot move bug ${b.status} → ${to}.`);
  }
  moveBugStatus(ctx, { bugId, to, note });
  return done({ clearNote: true });
}

export function toggleChecklistItem(ctx, taskId, itemIndex) {
  toggleChecklistItemRecord(ctx, { taskId, itemIndex });
  return done();
}
