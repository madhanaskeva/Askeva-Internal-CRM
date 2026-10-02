// Sidebar navigation with live counts — port of the original `navAll` / `nav`.
import { ROLE_NAV } from "../../data";
import { getFinMap, getHealthMap, memoLast } from "../storage/crmData";
import { TODAY, daysBetween } from "../helpers/date";
import { isDone, taskTrack } from "./tasks";

const trackForRole = (role) =>
  role === "Frontend" ? "frontend" : role === "DevOps" ? "devops" : "backend";

/** Live badge count per view. `data` is the role-scoped dataset, `full` the unscoped one. */
export const getNavCounts = memoLast((data, full, role) => {
<<<<<<< HEAD
    const H = getHealthMap(data);
    const FIN = getFinMap(data);
    const openTasks = data.tasks.filter((t) => !isDone(t));
    const myTrack = trackForRole(role);
    const payMonth = TODAY.slice(0, 7);
    const lowMargin = data.projects.filter((p) => FIN[p.id].margin != null && FIN[p.id].margin < 20).length;
    const overdueInv = Object.values(FIN).reduce((s, f) => s + f.overdueInv.length, 0);
    const byRoleTrack = (t) =>
      role === "Frontend" ? taskTrack(t) === "frontend"
        : role === "Backend" ? taskTrack(t) === "backend"
        : role === "DevOps" ? taskTrack(t) === "devops"
        : true;
    return {
      dashboard: 0,
      mywork: data.tasks.filter((t) => !isDone(t) && t.acceptance !== "pending" && t.assignee !== "Unassigned" && taskTrack(t) === myTrack).length,
      inbox: role === "Tester"
        ? data.tasks.filter((t) => t.acceptance === "pending" && (t.assignee === "Divya" || t.assignee === "Tester")).length
        : data.tasks.filter((t) => t.acceptance === "pending" && taskTrack(t) === myTrack).length,
      qa: data.tasks.filter((t) => t.status === "devdone").length + data.bugs.filter((b) => b.status === "Fixed").length,
      client: 0,
      audit: 0,
      team: (data.staff || []).filter((s) => s.status === "Active").length,
      deploy: (data.releases || []).filter((r) => ["requested", "go"].includes(r.status)).length,
      pl: 0,
      settings: 0,
      teamqa: data.tasks.filter((t) => t.status === "devdone").length,
      communication: (data.clientCommunications || []).filter((c) => c.court === "client").length,
      syslog: (full.syslog || []).filter((l) => l.date === TODAY).length,
      projects: data.projects.length,
      deadlines: data.projects.filter((p) => H[p.id].status === "Delayed").length,
      finance: overdueInv + lowMargin,
      salary: (data.payroll || []).filter((e) => e.month === payMonth && e.status !== "Paid").length,
      tasks: openTasks.filter(byRoleTrack).length,
      followups: data.followups.filter((f) => f.status === "pending" && daysBetween(f.due, TODAY) <= 0).length,
      crs: data.crs.filter((c) => c.status !== "Approved" && c.status !== "Rejected").length,
    };
=======
  const H = getHealthMap(data);
  const FIN = getFinMap(data);
  const openTasks = data.tasks.filter((t) => !isDone(t));
  const myTrack = trackForRole(role);
  const payMonth = TODAY.slice(0, 7);
  const lowMargin = data.projects.filter(
    (p) => FIN[p.id].margin != null && FIN[p.id].margin < 20,
  ).length;
  const overdueInv = Object.values(FIN).reduce(
    (s, f) => s + f.overdueInv.length,
    0,
  );
  const byRoleTrack = (t) =>
    role === "Frontend"
      ? taskTrack(t) === "frontend"
      : role === "Backend"
        ? taskTrack(t) === "backend"
        : role === "DevOps"
          ? taskTrack(t) === "devops"
          : true;
  return {
    dashboard: 0,
    mywork: data.tasks.filter(
      (t) =>
        !isDone(t) &&
        t.acceptance !== "pending" &&
        t.assignee !== "Unassigned" &&
        taskTrack(t) === myTrack,
    ).length,
    inbox: data.tasks.filter(
      (t) => t.acceptance === "pending" && taskTrack(t) === myTrack,
    ).length,
    qa:
      data.tasks.filter((t) => t.status === "devdone").length +
      data.bugs.filter((b) => b.status === "Fixed").length,
    client: 0,
    audit: 0,
    team: (data.staff || []).filter((s) => s.status === "Active").length,
    deploy: (data.releases || []).filter((r) =>
      ["requested", "go"].includes(r.status),
    ).length,
    pl: 0,
    settings: 0,
    teamqa: data.tasks.filter((t) => t.status === "devdone").length,
    syslog: (full.syslog || []).filter((l) => l.date === TODAY).length,
    projects: data.projects.length,
    deadlines: data.projects.filter((p) => H[p.id].status === "Delayed").length,
    finance: overdueInv + lowMargin,
    salary: (data.payroll || []).filter(
      (e) => e.month === payMonth && e.status !== "Paid",
    ).length,
    tasks: openTasks.filter(byRoleTrack).length,
    followups: data.followups.filter(
      (f) => f.status === "pending" && daysBetween(f.due, TODAY) <= 0,
    ).length,
    crs: data.crs.filter(
      (c) => c.status !== "Approved" && c.status !== "Rejected",
    ).length,
  };
>>>>>>> 854ee094fc263db027b67cefb82ee1b277d19d36
});

const navLabel = (view, role) =>
  ({
    dashboard: "Dashboard",
    mywork: "My work",
    inbox: "Inbox",
    qa: "QA dashboard",
    client: "Client portal",
    audit: "Daily audit",
    team: "Team",
    deploy: "Deploy",
    pl: "P&L",
    settings: "Settings",
    teamqa: "Team QA",
    syslog: "System log",
    projects: "Projects",
    deadlines: "Deadlines",
    finance: "Finance & P&L",
    salary: "Salary & payroll",
    followups: "Follow-ups",
    crs: "Change requests",
    tasks:
      role === "Tester"
        ? "All tasks"
        : ["Frontend", "Backend", "DevOps"].includes(role)
          ? "My tasks"
          : "Tasks",
  })[view];

/** Dashboard gets shortcut children (Tasks / Finance / Follow-ups) like the original sidebar. */

/** Roles whose Dashboard has no shortcut children. */
const NO_DASHBOARD_CHILDREN = ["PM", "PC"];

/** Sidebar items (with counts) for a role. */
export const getNavItems = memoLast((role, counts) =>
  ROLE_NAV[role].map((view) => ({
    view,
    label: navLabel(view, role),
    count: counts[view] || 0,
    children:
      view === "dashboard" && !NO_DASHBOARD_CHILDREN.includes(role)
        ? DASHBOARD_CHILDREN.map(([v, label]) => ({
            view: v,
            label,
            count: counts[v] || 0,
          }))
        : [],
  })),
);

/**
 * Views the current role may open: its ROLE_NAV entries, project detail when it
 * can see projects, and the dashboard shortcut views (the original sidebar let
 * every dashboard role jump to Tasks / Finance / Follow-ups).
 */
export const getAllowedViews = memoLast((role) => {
  const views = new Set(ROLE_NAV[role]);
  if (views.has("projects")) views.add("detail");
  if (views.has("dashboard") && !NO_DASHBOARD_CHILDREN.includes(role))
    DASHBOARD_CHILDREN.forEach(([v]) => views.add(v));
  return views;
});
