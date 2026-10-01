// Projects: lifecycle gates, milestones, deadlines, finance, client portal.
import { GATES, STORAGE_KEYS, projects as defaultProjects } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const projects = createCollection(STORAGE_KEYS.PROJECTS, defaultProjects);

export const getProjects = projects.getAll;
export const getProjectById = projects.getById;
export const projectExists = (id) => projects.some((p) => p.id === id);
export const getProjectsByPm = (pmId) => projects.filter((p) => p.pmId === pmId);

const clientLog = (p, date, text) => {
  p.clientLog = p.clientLog || [];
  p.clientLog.push({ date, text });
};

/** Add a line to a project's client-visible log. */
export const addClientLog = (projectId, date, text) => projects.update(projectId, (p) => clientLog(p, date, text));

/** payload: { project } — fully built record from the New project form. */
export function addProject(ctx, { project }) {
  projects.add(project);
  addLog(ctx);
}

/** payload: { projectId, stage, key } */
export function toggleGate(ctx, { projectId, stage, key }) {
  projects.update(projectId, (x) => {
    x.gates[stage] = x.gates[stage] || {};
    x.gates[stage][key] = !x.gates[stage][key];
  });
  addLog(ctx);
}

/** Advance one stage; records an override when the gate was incomplete. */
export function advanceStage(ctx, { projectId }) {
  projects.update(projectId, (x) => {
    const n = x.stage;
    const items = GATES[n].items;
    const missing = items.filter(([k]) => !(x.gates[n] && x.gates[n][k])).map(([, l]) => l);
    if (items.length && missing.length) {
      x.overrides = x.overrides || [];
      x.overrides.push({ date: ctx.date, stage: n, missing });
    }
    x.stage++;
  });
  addLog(ctx);
}

/** payload: { projectId, onHold, reason } */
export function setHold(ctx, { projectId, onHold, reason }) {
  const x = getProjectById(projectId);
  if (onHold) {
    projects.update(projectId, (p) => {
      p.onHold = true;
      p.holdReason = reason;
      p.holdOn = ctx.date;
      clientLog(p, ctx.date, "Project on hold — " + reason);
    });
    addLog(ctx, "On hold · " + x.code);
  } else {
    projects.update(projectId, (p) => {
      p.onHold = false;
      p.holdReason = "";
      clientLog(p, ctx.date, "Project resumed");
    });
    addLog(ctx, "Resumed " + x.code);
  }
}

export function addRedesign(ctx, { projectId }) {
  projects.update(projectId, (x) => { x.redesigns++; });
  addLog(ctx);
}

/** PM assignment (Settings → Project → PM). */
export function assignPm(ctx, { projectId, pmId }) {
  projects.update(projectId, { pmId: pmId || null });
  addLog(ctx, "Assigned PM to " + (getProjectById(projectId) || {}).code);
}

// ——— Milestones & deadline revisions ———

export function toggleMilestone(ctx, { projectId, index }) {
  projects.update(projectId, (x) => {
    const m = x.milestones[index];
    m.actual = m.actual ? null : ctx.date;
  });
  addLog(ctx);
}

export function setMilestoneTarget(ctx, { projectId, index, target }) {
  projects.update(projectId, (x) => { x.milestones[index].target = target; });
  addLog(ctx);
}

/** Client comment on a milestone (portal). */
export function commentMilestone(ctx, { projectId, index, text, by }) {
  projects.update(projectId, (x) => {
    const m = x.milestones[index];
    m.comments = m.comments || [];
    m.comments.push({ date: ctx.date, by, text });
  });
  addLog(ctx);
}

/** payload: { projectId, revisionId, form: {to, reason, category} } */
export function requestRevision(ctx, { projectId, revisionId, form }) {
  projects.update(projectId, (p) => {
    p.revisions = p.revisions || [];
    p.revisions.push({ id: revisionId, date: ctx.date, from: p.deadline, to: form.to, category: form.category, reason: form.reason, status: "Pending", by: "PC" });
  });
  addLog(ctx);
}

export function decideRevision(ctx, { projectId, revisionId, approve }) {
  projects.update(projectId, (p) => {
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
  });
  addLog(ctx);
}

// ——— Finance ———

/** payload: { projectId, form: {category, note} } */
export function logOverrun(ctx, { projectId, form }) {
  projects.update(projectId, { overrun: { date: ctx.date, category: form.category, note: form.note, ack: false } });
  addLog(ctx);
}

export function acknowledgeOverrun(ctx, { projectId }) {
  projects.update(projectId, (p) => {
    if (p.overrun) {
      p.overrun.ack = true;
      p.overrun.ackOn = ctx.date;
    }
  });
  addLog(ctx);
}

export function toggleInvoice(ctx, { projectId, invoiceId }) {
  projects.update(projectId, (p) => {
    const i = p.invoices.find((y) => y.id === invoiceId);
    i.status = i.status === "Received" ? "Due" : "Received";
  });
  addLog(ctx);
}

export function addInvoice(ctx, { projectId, invoice }) {
  projects.update(projectId, (p) => ({ ...p, invoices: [...(p.invoices || []), invoice] }));
  addLog(ctx);
}

export function addExpense(ctx, { projectId, expense }) {
  projects.update(projectId, (p) => ({ ...p, expenses: [...(p.expenses || []), expense] }));
  addLog(ctx);
}

export function removeExpense(ctx, { projectId, expenseId }) {
  projects.update(projectId, (p) => ({ ...p, expenses: p.expenses.filter((y) => y.id !== expenseId) }));
  addLog(ctx);
}

/** "+1 day" on an effort row. */
export function addEffortDay(ctx, { projectId, key }) {
  projects.update(projectId, (p) => {
    p.effort = p.effort || {};
    p.effort[key] = (p.effort[key] || 0) + 1;
  });
  addLog(ctx);
}

/** payload: { projectId, entry: {id, role, days, crId, unapproved} } */
export function logEffort(ctx, { projectId, entry }) {
  projects.update(projectId, (p) => {
    p.effort = p.effort || { ui: 0, backend: 0, tester: 0, pc: 0 };
    p.effort[entry.role] = (p.effort[entry.role] || 0) + entry.days;
    p.effortLog = p.effortLog || [];
    p.effortLog.push({ ...entry, date: ctx.date });
  });
  addLog(ctx);
}

// ——— Client portal ———

/** Client approves a gate item from the portal. */
export function approveClientGate(ctx, { projectId, stage, key, label, spoc }) {
  projects.update(projectId, (x) => {
    x.gates[stage] = x.gates[stage] || {};
    x.gates[stage][key] = true;
    clientLog(x, ctx.date, `${spoc} approved: ${label} (via portal)`);
  });
  addLog(ctx);
}

/** Client marks brand inputs uploaded. */
export function markClientInputs(ctx, { projectId, spoc }) {
  projects.update(projectId, (x) => {
    x.gates[4] = x.gates[4] || {};
    x.gates[4].inputs = true;
    clientLog(x, ctx.date, `${spoc} marked brand inputs as uploaded (via portal)`);
  });
  addLog(ctx);
}
