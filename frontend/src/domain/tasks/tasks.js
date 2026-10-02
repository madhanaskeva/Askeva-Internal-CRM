import { BACK, FRONT, OPS, TERMINAL, TRANS } from "../../constants/crm";

export const isDone = (t) => TERMINAL.includes(t.status);

export const trackOf = (t) =>
  FRONT.includes(t.assignee) ? "frontend"
    : BACK.includes(t.assignee) ? "backend"
    : OPS.includes(t.assignee) ? "devops"
    : ["Tester", "Divya"].includes(t.assignee) ? "qa"
    : "pc";

export const taskTrack = (t) => t.track || trackOf(t);

export const DEV_TRACK = (t) => ["frontend", "backend", "devops"].includes(taskTrack(t));

export const needsAccept = (t) => DEV_TRACK(t) && t.assignee && t.assignee !== "Unassigned" && !t.selfCreated;

/** The developer track owned by a role, or null. */
export const roleTrack = (role) =>
  role === "Frontend" ? "frontend" : role === "Backend" ? "backend" : role === "DevOps" ? "devops" : null;

/** Which task-flow role the current app role plays for this task. */
export const roleFor = (role, t) => {
  if (role === "Frontend") return taskTrack(t) === "frontend" ? "Assignee" : "None";
  if (role === "Backend") return taskTrack(t) === "backend" ? "Assignee" : "None";
  if (role === "DevOps") return taskTrack(t) === "devops" ? "Assignee" : "None";
  if (role === "Client") return "None";
  if (role === "Admin" || role === "SuperAdmin") return "PM";
  return role;
};

export const canMove = (role, t, to) => {
  const r = roleFor(role, t);
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
export const actorName = ({ role, pmId, clientProject }, data) => {
  if (role === "Frontend") return "Rahul";
  if (role === "Backend") return "Farhan";
  if (role === "Tester") return "Divya";
  if (role === "DevOps") return "Naveen";
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
