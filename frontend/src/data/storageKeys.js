// localStorage / sessionStorage keys.

/** One key per dataset (see utils/entities/*Utils.js). */
export const STORAGE_KEYS = {
  PROJECTS: "askeva-crm-projects",
  TASKS: "askeva-crm-tasks",
  BUGS: "askeva-crm-bugs",
  FOLLOWUPS: "askeva-crm-followups",
  CHANGE_REQUESTS: "askeva-crm-change-requests",
  COMMUNICATIONS: "askeva-crm-communications",
  STAFF: "askeva-crm-staff",
  PAYROLL: "askeva-crm-payroll",
  RELEASES: "askeva-crm-releases",
  CLIENT_ACCOUNTS: "askeva-crm-client-accounts",
  SYSLOG: "askeva-crm-syslog",
  RULES: "askeva-crm-rules",
  SIGNOFFS: "askeva-crm-signoffs",
  /** Migration flags (v2seed, v2qa, …) and the "initialised" marker. */
  META: "askeva-crm-meta",
};

/**
 * Single-blob keys used by earlier versions (HTML app and the Redux version).
 * Read once on first load and split into STORAGE_KEYS, so existing data is kept.
 */
export const STORAGE_KEY = "askeva-pc-crm-v2";
export const LEGACY_STORAGE_KEY = "askeva-pc-crm-v1";

/** Signed-in role (sessionStorage). */
export const SESSION_KEY = "askeva-crm-session";
