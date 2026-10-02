// App roles, their labels, navigation and who may do what.

export const ROLES = ["SuperAdmin", "Admin", "PM", "PC", "Frontend", "Backend", "Tester", "DevOps", "Client"];
export const ROLE_LABEL = { SuperAdmin: "Super admin", Admin: "Admin", PM: "Project Manager", PC: "Project Coordinator", Frontend: "Front-end Dev", Backend: "Back-end Dev", Tester: "Tester / QA", DevOps: "DevOps", Client: "Client" };
export const ROLE_WHO = { SuperAdmin: "Full system · rules · log", Admin: "Meera · staff, P&L, settings", PC: "PC · runs every project", Frontend: "Rahul · UI track", Backend: "Farhan · API track", Tester: "Divya · QA", DevOps: "Naveen · deploys & infra", Client: "SPOC · portal only" };

export const FRONT = ["Rahul", "Sneha", "UI team"];
export const BACK = ["Farhan", "Imran", "Dev team", "Senior Dev", "Karthik"];
export const OPS = ["Naveen", "DevOps"];

/**
 * Staff roles (Settings → Staff) that sign in as each personal app role.
 * Sign-in shows one card per registered person, so tasks reach them by name.
 */
export const ROLE_STAFF = { Frontend: ["UI / Frontend"], Backend: ["Backend", "Senior Dev / Architect"], DevOps: ["DevOps"], Tester: ["Manual tester"] };

/** Default person for a personal role when nobody of that role is registered. */
export const ROLE_DEFAULT_NAME = { Frontend: "Rahul", Backend: "Farhan", DevOps: "Naveen", Tester: "Divya" };

/** Staff role → task track. */
export const STAFF_TRACK = { "UI / Frontend": "frontend", Backend: "backend", "Senior Dev / Architect": "backend", DevOps: "devops", "Manual tester": "qa" };

/** Shared pool assignees every developer of a track also picks up. */
export const TRACK_POOL = { frontend: ["UI team"], backend: ["Dev team", "Senior Dev"], devops: ["DevOps"] };

/** Views each role may open, in sidebar order. The first entry is the role's landing view. */
export const ROLE_NAV = {
  SuperAdmin: ["dashboard", "projects", "deadlines", "crs", "teamqa", "deploy", "audit", "team", "pl", "finance", "salary", "settings", "syslog"],
  Admin: ["dashboard", "projects", "deadlines", "crs", "teamqa", "deploy", "audit", "team", "pl", "finance", "salary", "settings"],
  PM: ["dashboard", "projects", "deadlines", "crs", "teamqa", "deploy", "audit", "team"],
  PC: ["dashboard", "projects", "deadlines", "crs", "teamqa", "deploy", "audit", "team", "tasks", "followups"],
  Frontend: ["mywork", "inbox", "tasks", "audit"],
  Backend: ["mywork", "inbox", "tasks", "audit"],
  Tester: ["qa", "tasks", "audit"],
  DevOps: ["deploy", "mywork", "inbox", "tasks", "audit"],
  Client: ["client"],
};

export const ROLE_OPTIONS = ["Admin", "Project Manager", "Project Coordinator", "UI / Frontend", "Backend", "Manual tester", "DevOps", "Senior Dev / Architect", "Sales"];

/** Roles that manage delivery (PC/PM + top management). */
export const MANAGERS = ["PC", "PM", "Admin", "SuperAdmin"];
export const TOP_ROLES = ["Admin", "SuperAdmin"];

/** Roles that may create tasks. */
export const TASK_CREATORS = ["PM", "PC", "DevOps", "Admin", "SuperAdmin"];

/** Developer roles that only see their own track. */
export const DEV_ROLES = ["Frontend", "Backend", "DevOps"];

/** Staff roles that others can report to (team structure). */
export const LEAD_ROLES = ["Admin", "Project Manager", "Project Coordinator"];

/** Default assignee choices (staff names are added at runtime). */
export const ASSIGNEE_BASE = ["PC", "PM", "UI team", "Dev team", "Senior Dev", "Tester", "Client SPOC", "Sales"];

/** Roles that deploy / roll back releases. */
export const DEPLOYERS = ["DevOps", "PM", "Admin", "SuperAdmin"];

/** Roles that give the production GO. */
export const GO_ROLES = ["PM", "Admin", "SuperAdmin"];

/** Who may record each production approval. */
export const APPROVERS = {
  seniorDev: ["PM", "PC", "Admin", "SuperAdmin"],
  pm: GO_ROLES,
  client: ["Client", "PM", "Admin", "SuperAdmin"],
};
