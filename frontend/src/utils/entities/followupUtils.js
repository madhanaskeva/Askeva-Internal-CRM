// Client / internal follow-ups.
import { STORAGE_KEYS, followups as defaultFollowups } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const followups = createCollection(STORAGE_KEYS.FOLLOWUPS, defaultFollowups);

export const getFollowups = followups.getAll;
export const getFollowupById = followups.getById;

export function addFollowup(ctx, { followup }) {
  followups.add(followup);
  addLog(ctx);
}

export function toggleFollowup(ctx, { followupId }) {
  followups.update(followupId, (x) => ({ ...x, status: x.status === "done" ? "pending" : "done" }));
  addLog(ctx);
}

/** Ball with us ↔ waiting on client. */
export function toggleFollowupCourt(ctx, { followupId }) {
  followups.update(followupId, (x) => ({ ...x, court: (x.court || "us") === "us" ? "client" : "us" }));
  addLog(ctx);
}

export function commentFollowup(ctx, { followupId, text }) {
  followups.update(followupId, (x) => ({ ...x, log: [...(x.log || []), { date: ctx.date, text }] }));
  addLog(ctx);
}
