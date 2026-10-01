// Option lists, tabs and labels used by pages (moved out of the UI files).

/** Deadline health statuses, worst last. */
export const DEADLINE_STATUSES = ["On track", "At risk", "Delayed"];
/** Sort order for health statuses (worst first). */
export const HEALTH_SEVERITY = { Delayed: 0, "At risk": 1, "On track": 2, Completed: 3 };

export const BUG_SEVERITIES = ["Critical", "High", "Medium", "Low"];

/** Effort buckets tracked per project. */
export const EFFORT_KEYS = ["ui", "backend", "tester", "pc"];

export const DASHBOARD_SORTS = [
  { value: "risk", label: "Risk" },
  { value: "pl", label: "Lowest P&L" },
  { value: "deadline", label: "Nearest deadline" },
  { value: "burn", label: "Highest burn" },
];

export const SMOKE_OPTIONS = [
  { value: "Passed", label: "Smoke test passed" },
  { value: "Failed", label: "Smoke test failed" },
];

export const QA_TABS = [
  { value: "activity", label: "My daily activity" },
  { value: "queue", label: "Queue · retest · decisions" },
];

export const SETTINGS_TABS = [
  { value: "staff", label: "Staff & roles" },
  { value: "tree", label: "Team structure" },
  { value: "pm", label: "Project → PM" },
  { value: "rules", label: "System rules" },
  { value: "clients", label: "Client accounts" },
];

/** Task board columns: [statuses, label, tone]. */
export const TASK_BOARD_COLUMNS = [
  [["__unassigned"], "Unassigned · declined", "rose"],
  [["todo"], "To do", "white"],
  [["doing"], "In progress", "lime"],
  [["devdone", "testing"], "Testing", "paper"],
  [["failed", "rework"], "Failed · Rework", "rose"],
  [["passed", "closed"], "Passed · Closed", "ink800"],
];

/** Release history step labels (Deploy page). */
export const RELEASE_HISTORY_TEXT = { requested: "Requested", deployed: "Deployed", rolled_back: "Rolled back", go: "GO for production", approved: "Approval" };
/** Release status text shown on a task (task drawer). */
export const RELEASE_STATE_TEXT = { requested: "awaiting DevOps", rolled_back: "ROLLED BACK", go: "PM GO given" };

/** Card tone per depth in the team structure tree. */
export const STRUCTURE_DEPTH_TONES = ["ink", "lime", "paper", "white"];

/** P&L page period filter. */
export const PL_PERIODS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

/** QA analytics period filter. */
export const QA_PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

/** QA analytics role filter. */
export const QA_ROLE_FILTERS = [
  { value: "all", label: "All roles" },
  { value: "pc", label: "Project Coordinator" },
  { value: "ui", label: "UI Developers" },
  { value: "backend", label: "Backend Developers" },
  { value: "tester", label: "Testers" },
  { value: "dev", label: "Developers" },
];

/** Team page per-person date range. */
export const PERSON_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "all", label: "All time" },
];

/** Tone per task status. */
export const TASK_STATUS_TONE = { todo: "white", doing: "lime", devdone: "paper", testing: "lime", failed: "danger", rework: "rose", passed: "green", closed: "ink" };

/** Label + tone per release status. */
export const RELEASE_STATUS = {
  requested: { label: "REQUESTED", tone: "lime" },
  go: { label: "PM GO · READY", tone: "ink" },
  deployed: { label: "DEPLOYED", tone: "green" },
  rolled_back: { label: "ROLLED BACK", tone: "danger" },
};
