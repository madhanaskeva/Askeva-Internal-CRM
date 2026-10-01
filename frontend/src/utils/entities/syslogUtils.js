// System / audit log. Every change in the other *Utils files appends one entry.
//
// `ctx` (built by utils/actions/context.js → makeCtx) describes who did it:
//   { actor, role, view, date, time, ts }
import { STORAGE_KEYS } from "../../data";
import { createCollection } from "../storage/collection";

const MAX_ENTRIES = 400;
const syslog = createCollection(STORAGE_KEYS.SYSLOG, []);

export const getSyslog = syslog.getAll;

export const getTodayLog = (date) => syslog.filter((l) => l.date === date);

/** Append an audit entry — same shape and 400-entry cap as the original `mut()`. */
export function addLog(ctx, label, meta = {}) {
  const log = syslog.getAll();
  const seq = ((log[log.length - 1] || {}).seq || 980) + 1;
  const entry = {
    id: "ACT-" + String(seq).padStart(6, "0"),
    seq,
    ts: ctx.ts,
    date: ctx.date,
    time: ctx.time,
    actor: ctx.actor,
    role: ctx.role,
    view: ctx.view,
    label: label || "Change",
    ...meta,
  };
  syslog.saveAll([...log, entry].slice(-MAX_ENTRIES));
}
