// Deployment rules — ported from requestRelease / deployRelease / rollbackRelease /
// requestProd / approveRelease / goRelease.
import { APPROVERS, DEPLOYERS, GO_ROLES, MANAGERS, TOP_ROLES } from "../../data";
import { uid } from "../helpers/format";
import { projectExists } from "../entities/projectUtils";
import {
  approveReleaseRecord, deployReleaseRecord, getReleaseById, markReleaseGo, requestProductionRelease, requestStagingRelease,
  rollbackReleaseRecord,
} from "../entities/releaseUtils";
import { done, refuse } from "./context";

export function requestStaging(ctx, taskId) {
  requestStagingRelease(ctx, { taskId, note: ctx.note, opsTaskId: "t" + uid() });
  return done({ clearNote: true, message: "Staging deploy requested. Naveen (DevOps) sees it in the Deploy queue." });
}

/** @param {{smoke:string, downtime:string}} opts  values from the deploy page form */
export function deployRelease(ctx, releaseId, { smoke = "Passed", downtime = "" } = {}) {
  if (!DEPLOYERS.includes(ctx.role)) return refuse("Only DevOps deploys.");
  const r = getReleaseById(releaseId);
  if (r.env === "production" && r.status !== "go") return refuse("Production needs a PM GO first.");
  const dt = (downtime || "none").trim() || "none";
  deployReleaseRecord(ctx, { releaseId, smoke, downtime: dt, note: ctx.note });
  return done({ clearNote: true, message: `${r.id} deployed to ${r.env}.` });
}

export function rollbackRelease(ctx, releaseId) {
  if (!DEPLOYERS.includes(ctx.role)) return refuse("Only DevOps rolls back.");
  const note = (ctx.note || "").trim();
  if (!note) return refuse("A reason is mandatory to roll back.");
  rollbackReleaseRecord(ctx, { releaseId, note });
  return done({ clearNote: true, message: "Rolled back and logged." });
}

export function requestProduction(ctx, projectId) {
  if (!projectId || !projectExists(projectId)) return refuse();
  if (!MANAGERS.includes(ctx.role)) return refuse("Only PC/PM request a production release.");
  requestProductionRelease(ctx, { projectId });
  return done({ message: "Production release requested — gates must clear before PM GO." });
}

export function approveRelease(ctx, releaseId, who) {
  const ok = APPROVERS[who];
  if (!ok.includes(ctx.role)) return refuse(`Only ${ok.join("/")} can record this approval.`);
  approveReleaseRecord(ctx, { releaseId, who });
  return done();
}

/** @param {{label:string, ok:boolean}[]} gates  production gates computed by the deploy page */
export function goRelease(ctx, releaseId, gates) {
  if (!GO_ROLES.includes(ctx.role)) return refuse("Only the PM gives the production GO.");
  const missing = gates.filter((g) => !g.ok);
  if (missing.length && !TOP_ROLES.includes(ctx.role)) return refuse("Gates not clear: " + missing.map((g) => g.label).join(", "));
  const label = missing.length ? "ADMIN OVERRIDE · production GO with gates missing: " + missing.map((g) => g.label).join(", ") : undefined;
  markReleaseGo(ctx, { releaseId, note: ctx.note, label });
  return done({ clearNote: true, message: "GO given. DevOps can deploy to production." });
}
