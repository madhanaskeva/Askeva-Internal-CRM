// Task + bug workflow rules — ported from moveTask / forceClose / toggleBlock /
// reassign / acceptTask / declineTask / handOver / ackHandover / moveBug.
// Each thunk validates against the current role, toasts the reason when
// refused (returning false), otherwise dispatches the crm reducer.
import { BUG_FLOW, MANAGERS, TRANS, TS_LABEL } from "../../constants/crm";
import { canMove, needsAccept, roleFor } from "../domain/tasks";
import { selectStrict } from "../../redux/selectors";
import { crmActions } from "../../redux/slices/crmSlice";
import { actionNoteChanged, modalOpened, taskClosed } from "../../redux/slices/uiSlice";
import { dispatch, getState, makeCtx, toast } from "./context";

const getTask = (state, id) => state.crm.tasks.find((t) => t.id === id);
const clearNote = () => actionNoteChanged("");

export const moveTask = (taskId, to, note = "") => {
  const state = getState();
  const role = state.session.role;
  const t = getTask(state, taskId);
  if (!canMove(role, t, to)) {
    const allowed = ((TRANS[t.status] || []).find(([s]) => s === to) || [[], []])[1].join(", ") || "nobody";
    dispatch(toast(`${role} cannot move "${TS_LABEL[t.status]}" → "${TS_LABEL[to]}". Allowed: ${allowed}.`));
    return false;
  }
  if (to === "doing" && needsAccept(t) && t.acceptance === "pending") {
    dispatch(toast("Accept the task first — it is still waiting in the Inbox."));
    return false;
  }
  if (t.assignee === "Unassigned") {
    dispatch(toast("Task is unassigned (declined). PC must assign a developer first."));
    return false;
  }
  if (to === "passed" && state.crm.bugs.some((b) => b.taskId === t.id && b.status !== "Verified")) {
    dispatch(toast("Cannot pass: open bugs on this task must be Verified first."));
    return false;
  }
  // Failing a task always goes through the "raise bug" form.
  if (to === "failed") {
    dispatch(modalOpened({ kind: "bug", extra: { taskId: t.id, projectId: t.projectId, assignee: t.assignee } }));
    return false;
  }
  dispatch(crmActions.taskMoved({ ctx: makeCtx(state), taskId, to, note, flowRole: roleFor(role, t) }));
  dispatch(clearNote());
  return true;
};

export const forceCloseTask = (taskId) => {
  const state = getState();
  if (selectStrict(state)) {
    dispatch(toast("strictGates is on — a task can only be Closed after Tester Passed."));
    return;
  }
  const t = getTask(state, taskId);
  dispatch(crmActions.taskForceClosed({ ctx: makeCtx(state), taskId, note: state.ui.actionNote, flowRole: roleFor(state.session.role, t) }));
  dispatch(clearNote());
};

export const toggleBlock = (taskId) => {
  const state = getState();
  const t = getTask(state, taskId);
  const note = (state.ui.actionNote || "").trim();
  if (!t.blocked && !note) {
    dispatch(toast("A reason is mandatory to block a task."));
    return;
  }
  dispatch(crmActions.taskBlockToggled({ ctx: makeCtx(state), taskId, note, flowRole: roleFor(state.session.role, t) }));
  dispatch(clearNote());
};

export const reassignTask = (taskId, to) => {
  const state = getState();
  if (!MANAGERS.includes(state.session.role)) {
    dispatch(toast("Only the task Owner (PC) or PM can change the assignee. Ask the PC."));
    return;
  }
  const t = getTask(state, taskId);
  if (!to || to === t.assignee) return;
  dispatch(crmActions.taskReassigned({ ctx: makeCtx(state), taskId, to }));
};

export const acceptTask = (taskId) => {
  const state = getState();
  const t = getTask(state, taskId);
  if (roleFor(state.session.role, t) !== "Assignee") {
    dispatch(toast("Only the assigned developer can accept this task."));
    return;
  }
  dispatch(crmActions.taskAccepted({ ctx: makeCtx(state), taskId, note: state.ui.actionNote }));
  dispatch(clearNote());
  dispatch(toast("Accepted. Due date stays as set by the PC."));
};

export const declineTask = (taskId) => {
  const state = getState();
  const t = getTask(state, taskId);
  if (roleFor(state.session.role, t) !== "Assignee") {
    dispatch(toast("Only the assigned developer can decline this task."));
    return;
  }
  const note = (state.ui.actionNote || "").trim();
  if (!note) {
    dispatch(toast("A reason is mandatory to decline a task."));
    return;
  }
  dispatch(crmActions.taskDeclined({ ctx: makeCtx(state), taskId, note }));
  dispatch(clearNote());
  dispatch(taskClosed());
  dispatch(toast("Declined. Task returned to the PC as Unassigned."));
};

export const handOverTask = (taskId, to) => {
  const state = getState();
  const t = getTask(state, taskId);
  if (roleFor(state.session.role, t) !== "Assignee") {
    dispatch(toast("Only the current assignee can hand over a task."));
    return;
  }
  if (!to || to === t.assignee) return;
  const note = (state.ui.actionNote || "").trim();
  if (!note) {
    dispatch(toast("Add a note explaining the handover first."));
    return;
  }
  dispatch(crmActions.taskHandedOver({ ctx: makeCtx(state), taskId, to, note }));
  dispatch(clearNote());
  dispatch(toast(`Handed over to ${to}. PC must acknowledge; ${to} must accept.`));
};

export const ackHandover = (taskId) => {
  const state = getState();
  if (!MANAGERS.includes(state.session.role)) {
    dispatch(toast("Only the PC (or PM) acknowledges handovers."));
    return;
  }
  dispatch(crmActions.handoverAcknowledged({ ctx: makeCtx(state), taskId }));
};

/**
 * Bug lifecycle: Open → Fixed (dev) → Retest (tester) → Verified / Reopened (tester);
 * dev may Reject (reason required) → tester accepts (NotABug) or reopens.
 */
export const moveBug = (bugId, to) => {
  const state = getState();
  const note = state.ui.actionNote || "";
  const r0 = state.session.role;
  const r = r0 === "Frontend" || r0 === "Backend" ? "Developer" : r0;
  const b = state.crm.bugs.find((x) => x.id === bugId);
  const rule = BUG_FLOW[b.status];
  if (to === "Verified" || to === "Reopened" || to === "NotABug") {
    if (!["Tester", "PM"].includes(r)) {
      dispatch(toast("Only the Tester can verify, reopen or close a bug."));
      return;
    }
  } else if (to === "Rejected") {
    if (!["Developer", "PM"].includes(r)) {
      dispatch(toast("Only the Developer can reject a bug."));
      return;
    }
    if (!note.trim()) {
      dispatch(toast("A reason is mandatory to reject a bug as not-a-bug."));
      return;
    }
  } else if (!rule || rule[0] !== to || !rule[1].includes(r)) {
    dispatch(toast(`${r0} cannot move bug ${b.status} → ${to}.`));
    return;
  }
  dispatch(crmActions.bugMoved({ ctx: makeCtx(state), bugId, to, note }));
  dispatch(clearNote());
};
