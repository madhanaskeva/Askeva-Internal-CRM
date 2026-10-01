// Map domain states → tone keys (see `.tone-*` / `.text-*` in global.css).
// These replace the inline `var(--…)` / hex colours the original computed.
import { COMPLETED_STAGE, TASK_STATUS_TONE } from "../../data";
import { TODAY, daysBetween } from "../helpers/date";

/** Deadline health → pill tone. */
export const healthTone = (s) => (s === "Delayed" ? "danger" : s === "At risk" ? "lime" : s === "Completed" ? "ink" : "green");

/** Project stage → pill tone. */
export const stageTone = (n) =>
  n >= COMPLETED_STAGE ? "green" : n >= 7 ? "ink" : n >= 6 ? "lime" : n >= 5 ? "ink" : n >= 4 ? "lime" : "white";

export const taskStatusTone = (s) => TASK_STATUS_TONE[s] || "white";

export const priorityTone = (p) => (p === "High" ? "ink" : p === "Med" ? "lime" : "white");

export const severityTone = (sv) => (["Critical", "High"].includes(sv) ? "ink" : "white");

/** Bug status pill tone (Verified/not-a-bug/open/rejected/other). */
export const bugStatusTone = (b) =>
  b.status === "Verified" ? (b.notABug ? "white" : "green") : b.status === "Open" ? "danger" : b.status === "Rejected" ? "paper" : "lime";

/** Margin % → text colour key. */
export const marginColor = (m) => (m == null ? "muted" : m < 20 ? "danger" : m < 35 ? "green" : "ink");

/**
 * Due-date descriptor used by tasks and follow-ups.
 * color is a text colour key: "danger" | "green" | "muted".
 */
export const dueInfo = (due, done) => {
  const dd = daysBetween(due, TODAY);
  if (done) return { label: "done", color: "muted", over: false };
  if (dd < 0) return { label: `overdue ${-dd}d`, color: "danger", over: true, dd };
  if (dd === 0) return { label: "today", color: "green", over: false, dd };
  return { label: `in ${dd}d`, color: "muted", over: false, dd };
};
