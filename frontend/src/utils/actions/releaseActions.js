// Deployment rules — ported from requestRelease / deployRelease / rollbackRelease /
// requestProd / approveRelease / goRelease.
import { MANAGERS, TOP_ROLES } from "../../constants/crm";
import { uid } from "../format";
import { crmActions } from "../../redux/slices/crmSlice";
import { actionNoteChanged } from "../../redux/slices/uiSlice";
import { dispatch, getState, makeCtx, toast } from "./context";

const DEPLOYERS = ["DevOps", "PM", "Admin", "SuperAdmin"];

/** Who may record each production approval. */
export const APPROVERS = {
  seniorDev: ["PM", "PC", "Admin", "SuperAdmin"],
  pm: ["PM", "Admin", "SuperAdmin"],
  client: ["Client", "PM", "Admin", "SuperAdmin"],
};

export const requestStaging = (taskId) => {
  const state = getState();
  dispatch(crmActions.stagingRequested({ ctx: makeCtx(state), taskId, note: state.ui.actionNote, opsTaskId: "t" + uid() }));
  dispatch(actionNoteChanged(""));
  dispatch(toast("Staging deploy requested. Naveen (DevOps) sees it in the Deploy queue."));
};

/** @param {{smoke:string, downtime:string}} opts  values from the deploy page form */
export const deployRelease = (releaseId, { smoke = "Passed", downtime = "" } = {}) => {
  const state = getState();
  if (!DEPLOYERS.includes(state.session.role)) {
    dispatch(toast("Only DevOps deploys."));
    return false;
  }
  const r = state.crm.releases.find((x) => x.id === releaseId);
  if (r.env === "production" && r.status !== "go") {
    dispatch(toast("Production needs a PM GO first."));
    return false;
  }
  const dt = (downtime || "none").trim() || "none";
  dispatch(crmActions.releaseDeployed({ ctx: makeCtx(state), releaseId, smoke, downtime: dt, note: state.ui.actionNote }));
  dispatch(actionNoteChanged(""));
  dispatch(toast(`${r.id} deployed to ${r.env}.`));
  return true;
};

export const rollbackRelease = (releaseId) => {
  const state = getState();
  if (!DEPLOYERS.includes(state.session.role)) {
    dispatch(toast("Only DevOps rolls back."));
    return;
  }
  const note = (state.ui.actionNote || "").trim();
  if (!note) {
    dispatch(toast("A reason is mandatory to roll back."));
    return;
  }
  dispatch(crmActions.releaseRolledBack({ ctx: makeCtx(state), releaseId, note }));
  dispatch(actionNoteChanged(""));
  dispatch(toast("Rolled back and logged."));
};

export const requestProduction = (projectId) => {
  const state = getState();
  if (!projectId || !state.crm.projects.some((p) => p.id === projectId)) return;
  if (!MANAGERS.includes(state.session.role)) {
    dispatch(toast("Only PC/PM request a production release."));
    return;
  }
  dispatch(crmActions.productionRequested({ ctx: makeCtx(state), projectId }));
  dispatch(toast("Production release requested — gates must clear before PM GO."));
};

export const approveRelease = (releaseId, who) => {
  const state = getState();
  const ok = APPROVERS[who];
  if (!ok.includes(state.session.role)) {
    dispatch(toast(`Only ${ok.join("/")} can record this approval.`));
    return;
  }
  dispatch(crmActions.releaseApproved({ ctx: makeCtx(state), releaseId, who }));
};

/** @param {{label:string, ok:boolean}[]} gates  production gates computed by the deploy page */
export const goRelease = (releaseId, gates) => {
  const state = getState();
  const role = state.session.role;
  if (!["PM", "Admin", "SuperAdmin"].includes(role)) {
    dispatch(toast("Only the PM gives the production GO."));
    return;
  }
  const missing = gates.filter((g) => !g.ok);
  const top = TOP_ROLES.includes(role);
  if (missing.length && !top) {
    dispatch(toast("Gates not clear: " + missing.map((g) => g.label).join(", ")));
    return;
  }
  const label = missing.length ? "ADMIN OVERRIDE · production GO with gates missing: " + missing.map((g) => g.label).join(", ") : undefined;
  dispatch(crmActions.releaseGo({ ctx: makeCtx(state), releaseId, note: state.ui.actionNote, label }));
  dispatch(actionNoteChanged(""));
  dispatch(toast("GO given. DevOps can deploy to production."));
};
