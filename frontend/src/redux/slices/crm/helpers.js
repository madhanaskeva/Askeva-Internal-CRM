// Shared reducer helpers for the crm slice.
//
// Every crm action carries a `ctx` produced by `makeCtx` (see utils/actions/context.js):
//   { actor, role, view, date, time, ts }
// Reducers stay pure: ids, timestamps and the acting user come in the payload.

/** Append an audit entry — same shape and 400-entry cap as the original `mut()`. */
export function logAction(state, ctx, label, meta = {}) {
  state.syslog = state.syslog || [];
  const last = state.syslog[state.syslog.length - 1] || {};
  const seq = (last.seq || 980) + 1;
  state.syslog.push({
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
  });
  if (state.syslog.length > 400) state.syslog = state.syslog.slice(-400);
}

export const findProject = (s, id) => s.projects.find((p) => p.id === id);
export const findTask = (s, id) => s.tasks.find((t) => t.id === id);
export const findBug = (s, id) => s.bugs.find((b) => b.id === id);
export const findRelease = (s, id) => (s.releases || []).find((r) => r.id === id);
export const findStaff = (s, id) => (s.staff || []).find((x) => x.id === id);
