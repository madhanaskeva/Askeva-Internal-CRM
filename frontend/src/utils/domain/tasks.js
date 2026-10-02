import { BACK, FRONT, OPS, ROLE_DEFAULT_NAME, STAFF_TRACK, TERMINAL, TRACK_POOL, TRANS } from "../../data";

export const isDone = (t) => TERMINAL.includes(t.status);

export const trackOf = (t) =>
  FRONT.includes(t.assignee) ? "frontend"
    : BACK.includes(t.assignee) ? "backend"
    : OPS.includes(t.assignee) ? "devops"
    : ["Tester", "Divya"].includes(t.assignee) ? "qa"
    : "pc";

export const taskTrack = (t) => t.track || trackOf(t);

/** Track for an assignee — a registered staff member by their role, else the built-in name lists. */
export const trackForAssignee = (name, staff = []) => {
  const s = staff.find((x) => x.name === name);
  return (s && STAFF_TRACK[s.role]) || trackOf({ assignee: name });
};

/** Is this task assigned to `me` (by name, or to my track's shared pool)? */
export const isMyTask = (t, me) => t.assignee === me || (TRACK_POOL[taskTrack(t)] || []).includes(t.assignee);

export const DEV_TRACK = (t) => ["frontend", "backend", "devops"].includes(taskTrack(t));

export const needsAccept = (t) =>
  ["frontend", "backend", "devops", "qa"].includes(taskTrack(t)) &&
  t.assignee &&
  t.assignee !== "Unassigned" &&
  !t.selfCreated;

/** The developer or tester track owned by a role, or null. */
export const roleTrack = (role) =>
  role === "Frontend" ? "frontend" : role === "Backend" ? "backend" : role === "DevOps" ? "devops" : role === "Tester" ? "qa" : null;

/**
 * Which task-flow role the current app role plays for this task. A developer is
 * the Assignee only of tasks on their track that are assigned to them (`me`).
 * A tester is the Assignee of their own QA tasks and acts as "Tester" on everything else.
 */
export const roleFor = (role, t, me) => {
  const track = roleTrack(role);
  const mine = taskTrack(t) === track && (!me || isMyTask(t, me));
  if (role === "Tester") return mine ? "Assignee" : "Tester";
  if (track) return mine ? "Assignee" : "None";
  if (role === "Client") return "None";
  if (role === "Admin" || role === "SuperAdmin") return "PM";
  return role;
};

export const canMove = (role, t, to, me) => {
  const r = roleFor(role, t, me);
  const devops = taskTrack(t) === "devops";
  if (devops && t.status === "devdone" && to === "closed") return ["Assignee", "PC", "PM"].includes(r);
  if (devops && t.status === "devdone" && to !== "closed") return false;
  const rule = (TRANS[t.status] || []).find(([s]) => s === to);
  if (!rule) return false;
  return rule[1].includes(r);
};

/** Transitions offered in the task drawer. DevOps tasks skip QA: devdone → closed. */
export const transitionsFor = (t) =>
  taskTrack(t) === "devops" && t.status === "devdone" ? [["closed", ["Assignee", "PC", "PM"]]] : TRANS[t.status] || [];

/** Name the current role acts as (used as the history/syslog actor). */
export const actorName = ({ role, pmId, clientProject, staffName }, data) => {
  if (ROLE_DEFAULT_NAME[role]) return staffName || ROLE_DEFAULT_NAME[role];
  if (role === "PM") {
    const staff = data.staff || [];
    const pm = staff.find((s) => s.id === pmId) || staff.find((s) => s.role === "Project Manager");
    return pm ? pm.name : "Anita";
  }
  if (role === "Admin") return "Admin";
  if (role === "SuperAdmin") return "Super admin";
  if (role === "Client") {
    const p = data.projects.find((x) => x.id === clientProject);
    return p ? p.spoc : "Client";
  }
  return role;
};

/**
 * Status a task moves to when dropped on a board column holding `statuses`
 * (the first one its workflow allows next), or null when that column is not a next step.
 */
export const dropTarget = (t, statuses) => {
  const next = transitionsFor(t).map(([s]) => s);
  return statuses.find((s) => next.includes(s)) || null;
};
