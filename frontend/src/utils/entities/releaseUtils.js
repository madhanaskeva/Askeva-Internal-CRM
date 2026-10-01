// Releases / deployments: staging requests, production GO, deploy, rollback.
import { STORAGE_KEYS, releases as defaultReleases } from "../../data";
import { createCollection } from "../storage/collection";
import { addClientLog, getProjectById } from "./projectUtils";
import { addLog } from "./syslogUtils";
import { closeTasksForRelease, getTaskById, insertTask, updateTask } from "./taskUtils";

const releases = createCollection(STORAGE_KEYS.RELEASES, defaultReleases);

export const getReleases = releases.getAll;
export const getReleaseById = releases.getById;
export const getProjectReleases = (projectId) => releases.filter((r) => r.projectId === projectId);

const nextReleaseId = () => "REL-" + String(getReleases().length + 1).padStart(3, "0");
const slug = (p) => (p.code || "app").toLowerCase().replace(/[^a-z0-9]/g, "");
const withHistory = (ctx, to, note) => (r) => {
  r.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, to, note: note || "" });
};

/**
 * Developer requests a staging deploy for a dev-done task; auto-creates the linked DevOps task.
 * payload: { taskId, note, opsTaskId }
 */
export function requestStagingRelease(ctx, { taskId, note, opsTaskId }) {
  const t = getTaskById(taskId);
  const id = nextReleaseId();
  const p = getProjectById(t.projectId) || {};
  const last = getProjectReleases(t.projectId).map((r) => r.version).sort().pop();
  let ver = "v0.1.0";
  if (last) {
    const m = /v(\d+)\.(\d+)\.(\d+)/.exec(last);
    ver = m ? `v${m[1]}.${m[2]}.${+m[3] + 1}` : last + "+";
  }
  const count = getReleases().length;
  releases.add({
    id, projectId: t.projectId, env: "staging", version: ver, tag: "build-" + (200 + count * 3), tasks: [t.id], notes: t.title,
    url: `https://staging.${slug(p)}.askeva.in`, requestedBy: ctx.actor, requestedOn: ctx.date, status: "requested",
    deployedBy: null, deployedOn: null, smoke: "", downtime: "",
    history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, to: "requested", note: (note || "").trim() }],
  });
  updateTask(taskId, (x) => {
    x.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, from: x.status, to: x.status, note: "STAGING REQUESTED — " + id });
  });
  insertTask({
    id: opsTaskId, projectId: t.projectId, title: `Deploy ${id} ${ver} to staging`, assignee: "Naveen", track: "devops", opsKind: "Deploy-linked",
    releaseId: id, owner: "PC", createdBy: ctx.actor, due: ctx.date, stage: "Infra", status: "todo", priority: t.priority, blocked: false, selfCreated: true,
    history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, from: null, to: "todo", note: "Auto-created from staging request " + id }],
  });
  addLog(ctx);
}

/** payload: { releaseId, smoke, downtime, note } */
export function deployReleaseRecord(ctx, { releaseId, smoke, downtime, note }) {
  const x = getReleaseById(releaseId);
  releases.update(releaseId, (r) => {
    r.status = "deployed";
    r.deployedBy = ctx.actor;
    r.deployedOn = ctx.date;
    r.smoke = smoke;
    r.downtime = downtime;
    withHistory(ctx, "deployed", `Smoke: ${smoke} · downtime ${downtime}${note ? " · " + note : ""}`)(r);
  });
  closeTasksForRelease(ctx, x.id, x.id);
  if (x.env === "production" && getProjectById(x.projectId)) {
    addClientLog(x.projectId, ctx.date, `Production release ${x.version} deployed`);
  }
  addLog(ctx);
}

/** payload: { releaseId, note } */
export function rollbackReleaseRecord(ctx, { releaseId, note }) {
  const x = getReleaseById(releaseId);
  releases.update(releaseId, (r) => {
    r.status = "rolled_back";
    withHistory(ctx, "rolled_back", "ROLLBACK — " + note)(r);
  });
  if (x.env === "production" && getProjectById(x.projectId)) {
    addClientLog(x.projectId, ctx.date, `Production release ${x.version} rolled back — ${note}`);
  }
  addLog(ctx);
}

/** Production cut of every staged task. payload: { projectId } */
export function requestProductionRelease(ctx, { projectId }) {
  const p = getProjectById(projectId);
  const id = nextReleaseId();
  const mine = getProjectReleases(projectId);
  const staged = mine.filter((r) => r.env === "staging" && r.status === "deployed").flatMap((r) => r.tasks);
  const last = mine.filter((r) => r.env === "staging").map((r) => r.version).sort().pop() || "v0.1.0";
  const m = /v(\d+)\.(\d+)/.exec(last);
  releases.add({
    id, projectId, env: "production", version: m ? `v${m[1]}.${+m[2] + 1}.0` : "v1.0.0", tag: "build-" + (200 + getReleases().length * 3),
    tasks: [...new Set(staged)], notes: "Production cut of all staged work", url: `https://app.${slug(p)}.in`,
    requestedBy: ctx.actor, requestedOn: ctx.date, status: "requested", deployedBy: null, deployedOn: null, smoke: "", downtime: "", approvals: {},
    history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, to: "requested", note: "" }],
  });
  addLog(ctx);
}

const APPROVAL_NOTE = { seniorDev: "Senior Dev approval recorded", pm: "PM approval", client: "Client approval (demo accepted)" };

/** payload: { releaseId, who: "seniorDev"|"pm"|"client" } */
export function approveReleaseRecord(ctx, { releaseId, who }) {
  releases.update(releaseId, (r) => {
    r.approvals = r.approvals || {};
    r.approvals[who] = ctx.date;
    withHistory(ctx, "approved", APPROVAL_NOTE[who])(r);
  });
  addLog(ctx);
}

/** payload: { releaseId, note, label } — label set when Admin overrides missing gates. */
export function markReleaseGo(ctx, { releaseId, note, label }) {
  releases.update(releaseId, (r) => {
    r.status = "go";
    withHistory(ctx, "go", "GO for production" + (note ? " · " + note : ""))(r);
  });
  addLog(ctx, label);
}
