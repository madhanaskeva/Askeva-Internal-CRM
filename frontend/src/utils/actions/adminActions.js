// Admin rules — ported from toggleStaff / removeStaff / setRule / resetDemo / runPayroll.
import { loadCrmData, clearCrmData } from "../storage/localStore";
import { uid } from "../format";
import { isDone } from "../domain/tasks";
import { crmActions } from "../../redux/slices/crmSlice";
import { dispatch, getState, makeCtx, toast } from "./context";

const findStaff = (state, id) => (state.crm.staff || []).find((x) => x.id === id);

export const toggleStaff = (staffId) => {
  const state = getState();
  const s = findStaff(state, staffId);
  if (!s) return;
  if (s.role === "Admin" && state.session.role !== "SuperAdmin") {
    dispatch(toast("Only the Super admin can deactivate an Admin."));
    return;
  }
  dispatch(crmActions.staffStatusToggled({ ctx: makeCtx(state), staffId }));
};

export const removeStaff = (staffId) => {
  const state = getState();
  const s = findStaff(state, staffId);
  if (!s) return;
  if (s.role === "Admin" && state.session.role !== "SuperAdmin") {
    dispatch(toast("Only the Super admin can remove an Admin."));
    return;
  }
  const inUse = state.crm.tasks.some((t) => t.assignee === s.name && !isDone(t)) || state.crm.projects.some((p) => p.pmId === staffId);
  if (inUse) {
    dispatch(toast("Cannot remove: open tasks or projects still point to this person. Deactivate instead or reassign first."));
    return;
  }
  dispatch(crmActions.staffRemoved({ ctx: makeCtx(state), staffId }));
};

export const setRule = (key, value) => {
  const state = getState();
  if (state.session.role !== "SuperAdmin") {
    dispatch(toast("Only the Super admin can change system rules."));
    return;
  }
  dispatch(crmActions.ruleSet({ ctx: makeCtx(state), key, value }));
};

/** Wipe saved data and reload the demo seed (Admin / Super admin). */
export const resetDemo = () => {
  if (!["Admin", "SuperAdmin"].includes(getState().session.role)) return;
  clearCrmData();
  dispatch(crmActions.dataReplaced(loadCrmData()));
  dispatch(toast("Demo data reset."));
};

export const runPayroll = (month) => {
  const state = getState();
  const ids = Object.fromEntries((state.crm.staff || []).map((s) => [s.id, "pr" + uid()]));
  dispatch(crmActions.payrollRun({ ctx: makeCtx(state), month, ids }));
};
