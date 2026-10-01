// Shared pieces for the workflow actions (taskActions, releaseActions, …).
//
// Actions are plain functions: they receive a `ctx`, check the business rules,
// write through the entity utils (→ localStorage) and return a result object.
// They never touch Redux; the caller decides what to do with the result
// (show `message` as a toast, clear the note, open a modal…).
import { TODAY, nowTime } from "../helpers/date";
import { actorName } from "../domain/tasks";
import { getProjects } from "../entities/projectUtils";
import { getStaff } from "../entities/staffUtils";

/**
 * Build the `ctx` every change expects: who did it, as which role, from which
 * view, when — plus the shared action note typed in the UI.
 * @param {{session: {role, pmId, clientProject}, view: string, note?: string}} who
 */
export const makeCtx = ({ session, view, note = "" }) => ({
  actor: actorName(session, { staff: getStaff(), projects: getProjects() }),
  role: session.role,
  view,
  note,
  date: TODAY,
  time: nowTime(),
  ts: Date.now(),
});

/**
 * Action result.
 *   ok         — the change was applied
 *   message    — text to show the user (toast)
 *   clearNote  — reset the shared action note
 *   openModal  — { kind, extra } form modal to open
 *   closeTask  — close the task drawer
 */
export const done = (extra = {}) => ({ ok: true, ...extra });
export const refuse = (message, extra = {}) => ({ ok: false, message, ...extra });
