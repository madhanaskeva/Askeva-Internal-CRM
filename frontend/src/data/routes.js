// View key ↔ URL. View keys are the original app's `view` values; ROLE_NAV
// (data/crm.js) decides which of them each role may open.

export const VIEW_PATHS = {
  dashboard: "/dashboard",
  projects: "/projects",
  detail: "/projects/:projectId",
  deadlines: "/deadlines",
  finance: "/finance",
  salary: "/salary",
  settings: "/settings",
  syslog: "/system-log",
  pl: "/pnl",
  deploy: "/deploy",
  team: "/team",
  inbox: "/inbox",
  mywork: "/my-work",
  qa: "/qa",
  teamqa: "/tester",
  audit: "/audit",
  client: "/client-portal",
  communication: "/communication",
  tasks: "/tasks",
  followups: "/follow-ups",
  crs: "/change-requests",
};

export const LOGIN_PATH = "/login";

/** Header eyebrow + title per view (detail uses the project name). */
export const VIEW_TITLES = {
  teamqa: ["Team QA workspace & quality analytics", "Team QA"],
  communication: ["Daily Call MoM, WhatsApp logs & Email confirmations", "Client communication"],
  settings: ["Staff, roles, structure & rules", "Settings"],
  syslog: ["Every change, every role", "System log"],
  pl: ["Profit & loss", "P&L"],
  deploy: ["Releases", "Deploy"],
  team: ["Per-person record · tasks, tests, bugs, history", "Team"],
  inbox: ["Allocation · accept or decline same day", "Inbox"],
  dashboard: ["Delivery overview", "Dashboard"],
  projects: ["Pipeline · SOP stages 0–7", "Projects"],
  detail: ["Project", "Project"],
  deadlines: ["Deadline analytics · milestones M1–M7", "Deadlines"],
  finance: ["Cost, expenses, staffing & P&L", "Finance"],
  salary: ["Employees, payroll & cost allocation", "Salary"],
  mywork: ["", "My work"],
  qa: ["My daily activity", "QA dashboard"],
  client: ["Progress, approvals & pending items", "Client portal"],
  audit: ["", "Daily audit"],
  tasks: ["Task management", "Tasks"],
  followups: ["Follow-up management", "Follow-ups"],
  crs: ["Change request register · SOP §8", "Change requests"],
};
