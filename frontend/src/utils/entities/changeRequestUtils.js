// Change requests (SOP §8).
import { CR_STATUSES, STORAGE_KEYS, changeRequests as defaultChangeRequests } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const crs = createCollection(STORAGE_KEYS.CHANGE_REQUESTS, defaultChangeRequests);

export const getChangeRequests = crs.getAll;
export const getChangeRequestById = crs.getById;
export const isOpenChangeRequest = (c) => c.status !== "Approved" && c.status !== "Rejected";

/** payload: { form } */
export function addChangeRequest(ctx, { form }) {
  crs.add({
    id: "CR-" + String(getChangeRequests().length + 1).padStart(3, "0"), projectId: form.projectId, title: form.title, kind: form.kind,
    raised: ctx.date, cost: form.cost || "—", timeline: form.timeline || "—", status: "Raised", email: false,
  });
  addLog(ctx);
}

export function toggleCrEmail(ctx, { crId }) {
  crs.update(crId, (x) => ({ ...x, email: !x.email }));
  addLog(ctx);
}

/** Move a CR one step; approving without client email is recorded as an override. */
export function advanceChangeRequest(ctx, { crId }) {
  crs.update(crId, (x) => {
    const next = CR_STATUSES[CR_STATUSES.indexOf(x.status) + 1];
    x.status = next;
    if (next === "Approved" && !x.email) {
      x.overridden = true;
      x.overriddenOn = ctx.date;
    }
  });
  addLog(ctx);
}

/** Client portal decision on a quoted CR. */
export function decideChangeRequestByClient(ctx, { crId, approve }) {
  crs.update(crId, approve
    ? { email: true, status: "Approved", approvedVia: "portal", approvedOn: ctx.date }
    : { status: "Rejected", declinedOn: ctx.date });
  addLog(ctx);
}
