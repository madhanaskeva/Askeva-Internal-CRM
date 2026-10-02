// Developer "My work" + "Inbox" view-models — port of the original `myTasks`,
// `inboxTasks`, `inbox` and `mw` in renderVals.
import { BACK, FRONT, STAGES } from "../../data";
import { TODAY, daysBetween, fmt } from "../helpers/date";
import { isDone, roleTrack, taskTrack } from "./tasks";
import { mapTask } from "./views";

const projectOf = (data, id) => data.projects.find((p) => p.id === id) || {};

/** Requirement reference line shown to a developer or tester for a project, per track. */
const refFor = (track, p) =>
  track === "frontend"
    ? `Design system ${((p.gates || {})[4] || {}).dsApproved ? "approved" : "pending approval"} · UI documentation · ${p.projectType || "—"}`
    : track === "devops"
      ? `${p.server || "server TBD"} · ${p.domain || "domain TBD"} · ${p.cloud || "no cloud elements"}`
      : track === "qa"
        ? `QA Testing Plan · Test cases · ${p.projectType || "—"}`
        : `Architecture ${((p.gates || {})[5] || {}).arch ? "approved by Senior Dev" : "not yet approved"} · BRD · ${p.server || "—"}`;

export function buildDevWork(data, role, H) {
  const track = role === "Tester" ? "qa" : roleTrack(role);
  const myTasks = role === "Tester"
    ? data.tasks.filter((t) => t.assignee === "Divya" || t.assignee === "Tester" || taskTrack(t) === "qa")
    : track ? data.tasks.filter((t) => taskTrack(t) === track) : [];
  const myBugs = track ? data.bugs.filter((b) => (FRONT.includes(b.developer) && track === "frontend") || (BACK.includes(b.developer) && track === "backend") || (track === "qa" && (b.tester === "Divya" || b.tester === "Tester"))) : [];
  const map = (t) => mapTask(t, data);

  const inbox = myTasks
    .filter((t) => t.acceptance === "pending" && !isDone(t))
    .sort((a, b) => (a.assignedOn || "").localeCompare(b.assignedOn || ""))
    .map((t) => ({ ...map(t), ref: refFor(taskTrack(t), projectOf(data, t.projectId)) }));

  const openBugs = myBugs.filter((b) => b.status === "Open");
  return {
    inbox,
    inboxLate: inbox.filter((t) => t.acceptLate).length,
    today: myTasks.filter((t) => ["todo", "doing"].includes(t.status) && !t.blocked && t.acceptance !== "pending").sort((a, b) => a.due.localeCompare(b.due)).map(map),
    rework: myTasks.filter((t) => ["failed", "rework"].includes(t.status)).map(map),
    waiting: myTasks.filter((t) => ["devdone", "testing"].includes(t.status)).map(map),
    blocked: myTasks.filter((t) => t.blocked && !isDone(t)).map(map),
    bugs: openBugs.map((b) => ({
      id: b.id,
      taskId: b.taskId,
      desc: b.desc,
      severity: b.severity,
      project: projectOf(data, b.projectId).client,
      task: (data.tasks.find((t) => t.id === b.taskId) || {}).title,
      age: daysBetween(TODAY, b.raised) + "d open",
    })),
    counts: {
      today: myTasks.filter((t) => ["todo", "doing"].includes(t.status)).length,
      rework: myTasks.filter((t) => ["failed", "rework"].includes(t.status)).length,
      waiting: myTasks.filter((t) => ["devdone", "testing"].includes(t.status)).length,
      bugs: openBugs.length,
      blocked: myTasks.filter((t) => t.blocked && !isDone(t)).length,
    },
    refs: data.projects
      .filter((p) => myTasks.some((t) => t.projectId === p.id && !isDone(t)))
      .map((p) => ({ id: p.id, client: p.client, stage: STAGES[p.stage], due: fmt(H[p.id].eff), ref: track === "backend" ? `Architecture ${((p.gates || {})[5] || {}).arch ? "approved by Senior Dev" : "not yet approved"} · ${p.server} · ${p.cloud || "no cloud elements listed"}` : refFor(track, p).replace("UI documentation", "UI doc") })),
  };
}
