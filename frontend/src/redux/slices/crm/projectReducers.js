// Project reducers: lifecycle gates, milestones, deadlines, finance, client portal.
import { GATES } from "../../../constants/crm";
import { findProject, logAction } from "./helpers";

const clientLog = (p, date, text) => {
  p.clientLog = p.clientLog || [];
  p.clientLog.push({ date, text });
};

export const projectReducers = {
  /** payload: { ctx, project } — fully built record from the New project form. */
  projectAdded(s, { payload: { ctx, project } }) {
    s.projects.push(project);
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, stage, key } */
  gateToggled(s, { payload: { ctx, projectId, stage, key } }) {
    const x = findProject(s, projectId);
    x.gates[stage] = x.gates[stage] || {};
    x.gates[stage][key] = !x.gates[stage][key];
    logAction(s, ctx);
  },

  /** Advance one stage; records an override when the gate was incomplete. payload: { ctx, projectId } */
  stageAdvanced(s, { payload: { ctx, projectId } }) {
    const x = findProject(s, projectId);
    const n = x.stage;
    const items = GATES[n].items;
    const missing = items.filter(([k]) => !(x.gates[n] && x.gates[n][k])).map(([, l]) => l);
    if (items.length && missing.length) {
      x.overrides = x.overrides || [];
      x.overrides.push({ date: ctx.date, stage: n, missing });
    }
    x.stage++;
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, onHold, reason } */
  holdSet(s, { payload: { ctx, projectId, onHold, reason } }) {
    const x = findProject(s, projectId);
    if (onHold) {
      x.onHold = true;
      x.holdReason = reason;
      x.holdOn = ctx.date;
      clientLog(x, ctx.date, "Project on hold — " + reason);
      logAction(s, ctx, "On hold · " + x.code);
    } else {
      x.onHold = false;
      x.holdReason = "";
      clientLog(x, ctx.date, "Project resumed");
      logAction(s, ctx, "Resumed " + x.code);
    }
  },

  /** payload: { ctx, projectId } */
  redesignAdded(s, { payload: { ctx, projectId } }) {
    findProject(s, projectId).redesigns++;
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, index } */
  milestoneToggled(s, { payload: { ctx, projectId, index } }) {
    const m = findProject(s, projectId).milestones[index];
    m.actual = m.actual ? null : ctx.date;
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, index, target } */
  milestoneTargetSet(s, { payload: { ctx, projectId, index, target } }) {
    findProject(s, projectId).milestones[index].target = target;
    logAction(s, ctx);
  },

  /** Client comment on a milestone (portal). payload: { ctx, projectId, index, text, by } */
  milestoneCommented(s, { payload: { ctx, projectId, index, text, by } }) {
    const m = findProject(s, projectId).milestones[index];
    m.comments = m.comments || [];
    m.comments.push({ date: ctx.date, by, text });
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, revisionId, form: {to, reason, category} } */
  revisionRequested(s, { payload: { ctx, projectId, revisionId, form } }) {
    const p = findProject(s, projectId);
    p.revisions = p.revisions || [];
    p.revisions.push({ id: revisionId, date: ctx.date, from: p.deadline, to: form.to, category: form.category, reason: form.reason, status: "Pending", by: "PC" });
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, revisionId, approve } */
  revisionDecided(s, { payload: { ctx, projectId, revisionId, approve } }) {
    const p = findProject(s, projectId);
    const r = p.revisions.find((y) => y.id === revisionId);
    if (approve) {
      r.status = "Approved";
      r.approvedBy = "PM";
      r.approvedOn = ctx.date;
      p.deadline = r.to;
      p.milestones[6].target = r.to;
    } else {
      r.status = "Rejected";
    }
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, form: {category, note} } */
  overrunLogged(s, { payload: { ctx, projectId, form } }) {
    findProject(s, projectId).overrun = { date: ctx.date, category: form.category, note: form.note, ack: false };
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId } */
  overrunAcknowledged(s, { payload: { ctx, projectId } }) {
    const p = findProject(s, projectId);
    if (p.overrun) {
      p.overrun.ack = true;
      p.overrun.ackOn = ctx.date;
    }
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, invoiceId } */
  invoiceToggled(s, { payload: { ctx, projectId, invoiceId } }) {
    const i = findProject(s, projectId).invoices.find((y) => y.id === invoiceId);
    i.status = i.status === "Received" ? "Due" : "Received";
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, invoice } */
  invoiceAdded(s, { payload: { ctx, projectId, invoice } }) {
    const p = findProject(s, projectId);
    p.invoices = p.invoices || [];
    p.invoices.push(invoice);
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, expense } */
  expenseAdded(s, { payload: { ctx, projectId, expense } }) {
    const p = findProject(s, projectId);
    p.expenses = p.expenses || [];
    p.expenses.push(expense);
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, expenseId } */
  expenseRemoved(s, { payload: { ctx, projectId, expenseId } }) {
    const p = findProject(s, projectId);
    p.expenses = p.expenses.filter((y) => y.id !== expenseId);
    logAction(s, ctx);
  },

  /** "+1 day" on an effort row. payload: { ctx, projectId, key } */
  effortDayAdded(s, { payload: { ctx, projectId, key } }) {
    const p = findProject(s, projectId);
    p.effort = p.effort || {};
    p.effort[key] = (p.effort[key] || 0) + 1;
    logAction(s, ctx);
  },

  /** payload: { ctx, projectId, entry: {id, role, days, crId, unapproved} } */
  effortLogged(s, { payload: { ctx, projectId, entry } }) {
    const p = findProject(s, projectId);
    p.effort = p.effort || { ui: 0, backend: 0, tester: 0, pc: 0 };
    p.effort[entry.role] = (p.effort[entry.role] || 0) + entry.days;
    p.effortLog = p.effortLog || [];
    p.effortLog.push({ ...entry, date: ctx.date });
    logAction(s, ctx);
  },

  /** Client approves a gate item from the portal. payload: { ctx, projectId, stage, key, label, spoc } */
  clientGateApproved(s, { payload: { ctx, projectId, stage, key, label, spoc } }) {
    const x = findProject(s, projectId);
    x.gates[stage] = x.gates[stage] || {};
    x.gates[stage][key] = true;
    clientLog(x, ctx.date, `${spoc} approved: ${label} (via portal)`);
    logAction(s, ctx);
  },

  /** Client marks brand inputs uploaded. payload: { ctx, projectId, spoc } */
  clientInputsMarked(s, { payload: { ctx, projectId, spoc } }) {
    const x = findProject(s, projectId);
    x.gates[4] = x.gates[4] || {};
    x.gates[4].inputs = true;
    clientLog(x, ctx.date, `${spoc} marked brand inputs as uploaded (via portal)`);
    logAction(s, ctx);
  },
};
