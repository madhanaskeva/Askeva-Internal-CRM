// Follow-ups, change requests, client communications and daily-audit sign-offs.
import { CR_STATUSES } from "../../../constants/crm";
import { logAction } from "./helpers";

const findFu = (s, id) => s.followups.find((f) => f.id === id);
const findCr = (s, id) => s.crs.find((c) => c.id === id);

export const workReducers = {
  /** payload: { ctx, followup } */
  followupAdded(s, { payload: { ctx, followup } }) {
    s.followups.push(followup);
    logAction(s, ctx);
  },

  /** payload: { ctx, followupId } */
  followupToggled(s, { payload: { ctx, followupId } }) {
    const x = findFu(s, followupId);
    x.status = x.status === "done" ? "pending" : "done";
    logAction(s, ctx);
  },

  /** Ball with us ↔ waiting on client. payload: { ctx, followupId } */
  followupCourtToggled(s, { payload: { ctx, followupId } }) {
    const x = findFu(s, followupId);
    x.court = (x.court || "us") === "us" ? "client" : "us";
    logAction(s, ctx);
  },

  /** payload: { ctx, followupId, text } */
  followupCommented(s, { payload: { ctx, followupId, text } }) {
    const x = findFu(s, followupId);
    x.log = x.log || [];
    x.log.push({ date: ctx.date, text });
    logAction(s, ctx);
  },

  /** payload: { ctx, form } */
  crAdded(s, { payload: { ctx, form } }) {
    s.crs.push({ id: "CR-" + String(s.crs.length + 1).padStart(3, "0"), projectId: form.projectId, title: form.title, kind: form.kind, raised: ctx.date, cost: form.cost || "—", timeline: form.timeline || "—", status: "Raised", email: false });
    logAction(s, ctx);
  },

  /** payload: { ctx, crId } */
  crEmailToggled(s, { payload: { ctx, crId } }) {
    const x = findCr(s, crId);
    x.email = !x.email;
    logAction(s, ctx);
  },

  /** Move a CR one step; approving without client email is recorded as an override. payload: { ctx, crId } */
  crAdvanced(s, { payload: { ctx, crId } }) {
    const x = findCr(s, crId);
    const i = CR_STATUSES.indexOf(x.status);
    const nextIsApprove = CR_STATUSES[i + 1] === "Approved";
    const hadEmail = x.email;
    x.status = CR_STATUSES[i + 1];
    if (nextIsApprove && !hadEmail) {
      x.overridden = true;
      x.overriddenOn = ctx.date;
    }
    logAction(s, ctx);
  },

  /** Client portal decision on a quoted CR. payload: { ctx, crId, approve } */
  crClientDecided(s, { payload: { ctx, crId, approve } }) {
    const x = findCr(s, crId);
    if (approve) {
      x.email = true;
      x.status = "Approved";
      x.approvedVia = "portal";
      x.approvedOn = ctx.date;
    } else {
      x.status = "Rejected";
      x.declinedOn = ctx.date;
    }
    logAction(s, ctx);
  },

  /** payload: { ctx, communication } */
  communicationAdded(s, { payload: { ctx, communication } }) {
    s.clientCommunications = s.clientCommunications || [];
    s.clientCommunications.push(communication);
    logAction(s, ctx);
  },

  /** payload: { ctx, communicationId } */
  communicationCourtToggled(s, { payload: { ctx, communicationId } }) {
    const item = (s.clientCommunications || []).find((x) => x.id === communicationId);
    if (item) item.court = item.court === "client" ? "us" : "client";
    logAction(s, ctx);
  },

  /** Daily audit sign-off. payload: { ctx, key: "Person|yyyy-mm-dd", who: "pc"|"pm" } */
  auditSigned(s, { payload: { ctx, key, who } }) {
    s.signoffs[key] = { ...(s.signoffs[key] || {}), [who]: true, [who + "On"]: ctx.date };
    logAction(s, ctx);
  },
};
