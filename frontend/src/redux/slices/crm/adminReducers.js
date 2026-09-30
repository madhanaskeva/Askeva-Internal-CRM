// Staff, payroll, PM assignment, system rules and client accounts.
import { findProject, findStaff, logAction } from "./helpers";

export const adminReducers = {
  /** Add or edit a full staff record. payload: { ctx, staffId?, newId, record } */
  staffSaved(s, { payload: { ctx, staffId, newId, record } }) {
    if (staffId) Object.assign(findStaff(s, staffId), record);
    else s.staff.push({ id: newId, status: "Active", ...record });
    logAction(s, ctx, staffId ? "Edited staff record · " + record.name : "Added staff · " + record.name);
  },

  /** payload: { ctx, staffId } */
  staffStatusToggled(s, { payload: { ctx, staffId } }) {
    const x = findStaff(s, staffId);
    const wasActive = x.status === "Active";
    x.status = wasActive ? "Inactive" : "Active";
    logAction(s, ctx, (wasActive ? "Deactivated " : "Reactivated ") + x.name);
  },

  /** payload: { ctx, staffId } */
  staffRemoved(s, { payload: { ctx, staffId } }) {
    const name = (findStaff(s, staffId) || {}).name;
    s.staff = s.staff.filter((x) => x.id !== staffId);
    s.staff.forEach((x) => { if (x.reportsTo === staffId) x.reportsTo = null; });
    logAction(s, ctx, "Removed staff · " + name);
  },

  /** payload: { ctx, staffId, to } */
  reportsToSet(s, { payload: { ctx, staffId, to } }) {
    const x = findStaff(s, staffId);
    if (x) x.reportsTo = to || null;
    logAction(s, ctx, "Changed reporting line");
  },

  /** payload: { ctx, projectId, pmId } */
  pmAssigned(s, { payload: { ctx, projectId, pmId } }) {
    const p = findProject(s, projectId);
    if (p) p.pmId = pmId || null;
    logAction(s, ctx, "Assigned PM to " + (p || {}).code);
  },

  /** payload: { ctx, key, value } */
  ruleSet(s, { payload: { ctx, key, value } }) {
    s.rules = s.rules || {};
    s.rules[key] = value;
    logAction(s, ctx, "Rule changed · " + key + " = " + value);
  },

  /** payload: { ctx, accountId } */
  clientAccountToggled(s, { payload: { ctx, accountId } }) {
    const c = s.clientAccounts.find((x) => x.id === accountId);
    if (c) c.status = c.status === "Active" ? "Suspended" : "Active";
    logAction(s, ctx, "Client account toggled");
  },

  /** Generate Pending payslips for active staff without one. payload: { ctx, month, ids: {staffId: newEntryId} } */
  payrollRun(s, { payload: { ctx, month, ids } }) {
    s.staff.filter((x) => x.status === "Active").forEach((x) => {
      if (s.payroll.some((pr) => pr.staffId === x.id && pr.month === month)) return;
      s.payroll.push({ id: ids[x.id], staffId: x.id, month, gross: (x.salary || 0) + (x.allowances || 0), bonus: 0, deductions: Math.round((x.salary || 0) * 0.12), status: "Pending", paidOn: null });
    });
    logAction(s, ctx);
  },

  /** payload: { ctx, entryId } */
  payslipPaidToggled(s, { payload: { ctx, entryId } }) {
    const e = s.payroll.find((x) => x.id === entryId);
    e.status = e.status === "Paid" ? "Pending" : "Paid";
    e.paidOn = e.status === "Paid" ? ctx.date : null;
    logAction(s, ctx);
  },

  /** payload: { ctx, entryId, bonus, deductions, note } */
  payslipAdjusted(s, { payload: { ctx, entryId, bonus, deductions, note } }) {
    const e = s.payroll.find((x) => x.id === entryId);
    if (e) Object.assign(e, { bonus, deductions, note });
    logAction(s, ctx);
  },
};
