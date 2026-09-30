// Domain constants — ported 1:1 from the original Internal CRM script.

export const STORAGE_KEY = "askeva-pc-crm-v2";
export const LEGACY_STORAGE_KEY = "askeva-pc-crm-v1";

export const STAGES = [
  "Sales handover",
  "Onboarding",
  "Requirement analysis",
  "Milestone planning",
  "UI/Frontend phase",
  "Backend phase",
  "Tester phase",
  "DevOps phase",
  "Handover",
  "Completed",
];
export const COMPLETED_STAGE = STAGES.indexOf("Completed");

export const GATES = [
  { hint: "PC responsibility starts only when payment is confirmed and Sales hands over the full pack (SOP §3).", items: [["payment", "Payment confirmation received"], ["docs", "Signed proposal / project documentation"], ["billing", "Billing model recorded (Fixed / Resource)"], ["contacts", "Client contacts + verbal commitments captured"], ["refs", "Pre-sales references collected"]] },
  { hint: "Onboarding checklist must be 100% complete before UI work starts (SOP §4.2).", items: [["domain", "Domain — existing or new, DNS access"], ["server", "Server — client-owned or Askeva-hosted"], ["cloud", "Cloud elements — S3, gateways, APIs"], ["spoc", "Client SPOC confirmed"], ["escalation", "Escalation matrix agreed (L1–L3)"], ["cost", "Project cost explained + email confirmation"], ["billingRec", "Billing model in tracker"], ["waGroup", "Client WhatsApp group created"], ["cadence", "Daily call time agreed"], ["mom", "Onboarding MoM posted + emailed"]] },
  { hint: "Requirement Analysis Document signed off by PM before planning (SOP §5).", items: [["featureList", "Feature / module / integration list complete"], ["gaps", "Gaps raised with client as one consolidated list"], ["answers", "Client answers received by email"], ["radSigned", "Requirement Analysis Document signed by PM"]] },
  { hint: "Milestone document and named resources per milestone (SOP §6).", items: [["milestones", "Milestone document M1–M7 with dates"], ["resources", "Named resources per milestone"], ["attendance", "Attendance / effort log started"]] },
  { hint: "UI/Frontend commitment: 7–10 working days with daily follow-up. Design system before screens; email approval freezes UI (SOP §7).", items: [["inputs", "Logo, brand colours, content received"], ["dsApproved", "Design system approved by client (email)"], ["screens", "All screens built and PC-reviewed"], ["uiDoc", "UI documentation up to date"], ["uiApproved", "Final UI approved by client email with checklist"]] },
  { hint: "Senior Developer confirms architecture before build and approves the tested build before client demo (SOP §9).", items: [["brd", "Backend Requirement Document confirmed by client"], ["testDoc", "Manual Test Document prepared"], ["arch", "Tech stack / architecture approved by Senior Dev"], ["devDone", "Development complete"], ["tested", "Testing complete — all Trello bugs closed"], ["srDevOk", "Senior Developer approval of build"], ["demo", "Demo credentials shared"], ["clientOk", "Client approval by email"]] },
  { hint: "Tester verifies all build features, regression test cases, and closes open bugs on staging (SOP §9.2).", items: [["testRun", "Full regression test run complete"], ["bugsVerified", "All critical/high bugs verified & closed"], ["qaSignoff", "Tester QA sign-off confirmed"]] },
  { hint: "DevOps prepares deployment infrastructure, verifies SSL/DNS, and cuts production release (SOP §9.3).", items: [["stagingDeploy", "Staging deployment verified"], ["prodPrep", "Production environment & SSL prepared"], ["releaseCut", "Production release candidate cut"]] },
  { hint: "No deployment or credentials before final payment. Training max 5 hours, recorded (SOP §10).", items: [["finalPay", "Final payment confirmed"], ["deploy", "Production deployment done"], ["dns", "Domain + SSL configured"], ["creds", "Credentials handed over securely"], ["kt", "KT video shared"], ["manual", "User manual shared"], ["training", "Training complete (≤5h, recorded)"], ["support", "Support terms explained"], ["signoff", "Handover sign-off email received"]] },
  { hint: "Project completed. Archive documents and inform the Key Account Manager.", items: [] },
];

export const CR_STATUSES = ["Raised", "Documented", "Estimated", "Quoted", "Approved"];
export const CR_STEPS = ["Raised", "Documented as out-of-scope", "Estimated by lead", "Quoted by email", "Client email confirmation", "Added to milestones"];

export const TASK_STATUSES = ["todo", "doing", "devdone", "testing", "failed", "rework", "passed", "closed"];
export const TS_LABEL = { todo: "To do", doing: "In progress", devdone: "Dev completed", testing: "Testing", failed: "Failed", rework: "Rework", passed: "Passed", closed: "Closed" };
export const TERMINAL = ["passed", "closed"];

export const ROLES = ["SuperAdmin", "Admin", "PM", "PC", "Frontend", "Backend", "Tester", "DevOps", "Client"];
export const ROLE_LABEL = { SuperAdmin: "Super admin", Admin: "Admin", PM: "Project Manager", PC: "Project Coordinator", Frontend: "Front-end Dev", Backend: "Back-end Dev", Tester: "Tester / QA", DevOps: "DevOps", Client: "Client" };
export const ROLE_WHO = { SuperAdmin: "Full system · rules · log", Admin: "Meera · staff, P&L, settings", PC: "PC · runs every project", Frontend: "Rahul · UI track", Backend: "Farhan · API track", Tester: "Divya · QA", DevOps: "Naveen · deploys & infra", Client: "SPOC · portal only" };

export const FRONT = ["Rahul", "Sneha", "UI team"];
export const BACK = ["Farhan", "Imran", "Dev team", "Senior Dev", "Karthik"];
export const OPS = ["Naveen", "DevOps"];

/** Views each role may open, in sidebar order. The first entry is the role's landing view. */
export const ROLE_NAV = {
  SuperAdmin: ["dashboard", "projects", "deadlines", "crs", "communication", "teamqa", "deploy", "audit", "team", "pl", "finance", "salary", "settings", "syslog"],
  Admin: ["dashboard", "projects", "deadlines", "crs", "communication", "teamqa", "deploy", "audit", "team", "pl", "finance", "salary", "settings"],
  PM: ["dashboard", "projects", "deadlines", "crs", "communication", "teamqa", "deploy", "audit", "team"],
  PC: ["dashboard", "projects", "deadlines", "crs", "communication", "teamqa", "deploy", "audit", "team", "tasks", "followups"],
  Frontend: ["mywork", "inbox", "tasks", "audit"],
  Backend: ["mywork", "inbox", "tasks", "audit"],
  Tester: ["qa", "tasks", "audit"],
  DevOps: ["deploy", "mywork", "inbox", "tasks", "audit"],
  Client: ["client"],
};

/** Task transitions: from → [[to, rolesAllowed]]. */
export const TRANS = {
  todo: [["doing", ["Assignee", "PC", "PM"]]],
  doing: [["devdone", ["Assignee", "PM"]]],
  devdone: [["testing", ["Tester", "PM"]]],
  testing: [["passed", ["Tester", "PM"]], ["failed", ["Tester", "PM"]]],
  failed: [["rework", ["Assignee", "PM"]]],
  rework: [["devdone", ["Assignee", "PM"]]],
  passed: [["closed", ["PC", "Tester", "PM"]]],
  closed: [],
};

export const BUG_FLOW = { Open: ["Fixed", ["Developer", "PM"]], Fixed: ["Retest", ["Tester", "PM"]], Retest: null, Rejected: null };

export const MS = ["Onboarding complete", "Design system approved", "UI approved", "Architecture approved", "Backend complete", "Testing & demo", "Final payment & handover"];

export const ROLE_OPTIONS = ["Admin", "Project Manager", "Project Coordinator", "UI / Frontend", "Backend", "Manual tester", "DevOps", "Senior Dev / Architect", "Sales"];

/** Roles that manage delivery (PC/PM + top management). */
export const MANAGERS = ["PC", "PM", "Admin", "SuperAdmin"];
export const TOP_ROLES = ["Admin", "SuperAdmin"];

export const DEFAULT_RULES = { strictGates: true, sameDayAccept: true, uiPhaseDays: 10, marginThreshold: 20, redesignLimit: 2, bugAgeRed: 3, prodNeedsClient: true };
