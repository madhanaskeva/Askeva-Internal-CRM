// Release / deployment reducers (staging requests, production GO, deploy, rollback).
import { isDone } from "../../../utils/domain/tasks";
import { findProject, findRelease, findTask, logAction } from "./helpers";

const relHist = (r, ctx, to, note) => r.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, to, note: note || "" });

const nextReleaseId = (s) => "REL-" + String(s.releases.length + 1).padStart(3, "0");
const slug = (p) => (p.code || "app").toLowerCase().replace(/[^a-z0-9]/g, "");

export const releaseReducers = {
  /**
   * Developer requests a staging deploy for a dev-done task; auto-creates the linked DevOps task.
   * payload: { ctx, taskId, note, opsTaskId }
   */
  stagingRequested(s, { payload: { ctx, taskId, note, opsTaskId } }) {
    const t = findTask(s, taskId);
    const id = nextReleaseId(s);
    const p = findProject(s, t.projectId) || {};
    const last = s.releases.filter((r) => r.projectId === t.projectId).map((r) => r.version).sort().pop();
    let ver = "v0.1.0";
    if (last) {
      const m = /v(\d+)\.(\d+)\.(\d+)/.exec(last);
      ver = m ? `v${m[1]}.${m[2]}.${+m[3] + 1}` : last + "+";
    }
    s.releases.push({
      id, projectId: t.projectId, env: "staging", version: ver, tag: "build-" + (200 + s.releases.length * 3), tasks: [t.id], notes: t.title,
      url: `https://staging.${slug(p)}.askeva.in`, requestedBy: ctx.actor, requestedOn: ctx.date, status: "requested",
      deployedBy: null, deployedOn: null, smoke: "", downtime: "",
      history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, to: "requested", note: (note || "").trim() }],
    });
    t.history.push({ date: ctx.date, actor: ctx.actor, role: ctx.role, from: t.status, to: t.status, note: "STAGING REQUESTED — " + id });
    s.tasks.push({
      id: opsTaskId, projectId: t.projectId, title: `Deploy ${id} ${ver} to staging`, assignee: "Naveen", track: "devops", opsKind: "Deploy-linked",
      releaseId: id, owner: "PC", createdBy: ctx.actor, due: ctx.date, stage: "Infra", status: "todo", priority: t.priority, blocked: false, selfCreated: true,
      history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, from: null, to: "todo", note: "Auto-created from staging request " + id }],
    });
    logAction(s, ctx);
  },

  /** payload: { ctx, releaseId, smoke, downtime, note } */
  releaseDeployed(s, { payload: { ctx, releaseId, smoke, downtime, note } }) {
    const x = findRelease(s, releaseId);
    x.status = "deployed";
    x.deployedBy = ctx.actor;
    x.deployedOn = ctx.date;
    x.smoke = smoke;
    x.downtime = downtime;
    s.tasks.filter((t) => t.releaseId === x.id && !isDone(t)).forEach((t) => {
      t.status = "closed";
      t.completedOn = ctx.date;
      t.closedOn = ctx.date;
      t.history.push({ date: ctx.date, actor: ctx.actor, role: "DevOps", from: "todo", to: "closed", note: "Closed by deploy of " + x.id });
    });
    relHist(x, ctx, "deployed", `Smoke: ${smoke} · downtime ${downtime}${note ? " · " + note : ""}`);
    if (x.env === "production") {
      const p = findProject(s, x.projectId);
      if (p) {
        p.clientLog = p.clientLog || [];
        p.clientLog.push({ date: ctx.date, text: `Production release ${x.version} deployed` });
      }
    }
    logAction(s, ctx);
  },

  /** payload: { ctx, releaseId, note } */
  releaseRolledBack(s, { payload: { ctx, releaseId, note } }) {
    const x = findRelease(s, releaseId);
    x.status = "rolled_back";
    relHist(x, ctx, "rolled_back", "ROLLBACK — " + note);
    if (x.env === "production") {
      const p = findProject(s, x.projectId);
      if (p) {
        p.clientLog = p.clientLog || [];
        p.clientLog.push({ date: ctx.date, text: `Production release ${x.version} rolled back — ${note}` });
      }
    }
    logAction(s, ctx);
  },

  /** Production cut of every staged task. payload: { ctx, projectId } */
  productionRequested(s, { payload: { ctx, projectId } }) {
    const p = findProject(s, projectId);
    const id = nextReleaseId(s);
    const staged = s.releases.filter((r) => r.projectId === projectId && r.env === "staging" && r.status === "deployed").flatMap((r) => r.tasks);
    const last = s.releases.filter((r) => r.projectId === projectId && r.env === "staging").map((r) => r.version).sort().pop() || "v0.1.0";
    const m = /v(\d+)\.(\d+)/.exec(last);
    s.releases.push({
      id, projectId, env: "production", version: m ? `v${m[1]}.${+m[2] + 1}.0` : "v1.0.0", tag: "build-" + (200 + s.releases.length * 3),
      tasks: [...new Set(staged)], notes: "Production cut of all staged work", url: `https://app.${slug(p)}.in`,
      requestedBy: ctx.actor, requestedOn: ctx.date, status: "requested", deployedBy: null, deployedOn: null, smoke: "", downtime: "", approvals: {},
      history: [{ date: ctx.date, actor: ctx.actor, role: ctx.role, to: "requested", note: "" }],
    });
    logAction(s, ctx);
  },

  /** payload: { ctx, releaseId, who: "seniorDev"|"pm"|"client" } */
  releaseApproved(s, { payload: { ctx, releaseId, who } }) {
    const x = findRelease(s, releaseId);
    x.approvals = x.approvals || {};
    x.approvals[who] = ctx.date;
    relHist(x, ctx, "approved", { seniorDev: "Senior Dev approval recorded", pm: "PM approval", client: "Client approval (demo accepted)" }[who]);
    logAction(s, ctx);
  },

  /** payload: { ctx, releaseId, note, label } — label set when Admin overrides missing gates. */
  releaseGo(s, { payload: { ctx, releaseId, note, label } }) {
    const x = findRelease(s, releaseId);
    x.status = "go";
    relHist(x, ctx, "go", "GO for production" + (note ? " · " + note : ""));
    logAction(s, ctx, label);
  },
};
