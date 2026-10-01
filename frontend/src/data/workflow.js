// Task, bug and change-request status flows.

export const TASK_STATUSES = ["todo", "doing", "devdone", "testing", "failed", "rework", "passed", "closed"];
export const TS_LABEL = { todo: "To do", doing: "In progress", devdone: "Dev completed", testing: "Testing", failed: "Failed", rework: "Rework", passed: "Passed", closed: "Closed" };
export const TERMINAL = ["passed", "closed"];

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

export const CR_STATUSES = ["Raised", "Documented", "Estimated", "Quoted", "Approved"];
export const CR_STEPS = ["Raised", "Documented as out-of-scope", "Estimated by lead", "Quoted by email", "Client email confirmation", "Added to milestones"];
