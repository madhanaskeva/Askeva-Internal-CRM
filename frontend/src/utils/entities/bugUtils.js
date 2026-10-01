// Bugs raised by testers against tasks.
import { STORAGE_KEYS } from "../../data";
import { createCollection } from "../storage/collection";
import { getTaskById, updateTask } from "./taskUtils";
import { addLog } from "./syslogUtils";

const bugs = createCollection(STORAGE_KEYS.BUGS, []);

export const getBugs = bugs.getAll;
export const getBugById = bugs.getById;
/** Open (not yet Verified) bugs on a task. */
export const hasOpenBugs = (taskId) => bugs.some((b) => b.taskId === taskId && b.status !== "Verified");

/** payload: { bugId, to, note } */
export function moveBugStatus(ctx, { bugId, to, note }) {
  const b = getBugById(bugId);
  const from = b.status;
  bugs.update(bugId, (x) => {
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
  });
  addLog(ctx, null, { projectId: b.projectId, taskId: b.taskId, bugId, action: "BUG_" + to.toUpperCase(), from, to, reason: note || "", severity: b.severity });
}

/** Tester fails a task by raising a linked bug. payload: { taskId, projectId, form } */
export function raiseBug(ctx, { taskId, projectId, form }) {
  const id = "BUG-" + String(getBugs().length + 1).padStart(3, "0");
  bugs.add({
    id, taskId, projectId, severity: form.severity, module: form.module || "General", desc: form.desc, evidence: form.evidence,
    developer: form.developer, tester: ctx.actor, status: "Open", raised: ctx.date, raisedTime: ctx.time, fixed: null, retest: null, result: "",
    history: [{ time: ctx.time, date: ctx.date, actor: ctx.actor, role: ctx.role, to: "Open", note: "Raised" }],
  });
  if (getTaskById(taskId)) {
    updateTask(taskId, (x) => {
      x.history.push({ date: ctx.date, actor: ctx.actor, role: "Tester", from: x.status, to: "failed", note: `${id} · ${form.desc}` });
      x.status = "failed";
    });
  }
  addLog(ctx, null, { projectId, taskId, action: "BUG_RAISED", severity: form.severity, evidence: form.evidence, to: "Open" });
}
