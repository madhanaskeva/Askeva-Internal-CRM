// Payroll entries (one per staff member per month).
import { STORAGE_KEYS, payroll as defaultPayroll } from "../../data";
import { createCollection } from "../storage/collection";
import { getStaff, isActive } from "./staffUtils";
import { addLog } from "./syslogUtils";

const payroll = createCollection(STORAGE_KEYS.PAYROLL, defaultPayroll);

export const getPayroll = payroll.getAll;
export const getPayslip = (staffId, month) => getPayroll().find((pr) => pr.staffId === staffId && pr.month === month);

/** Generate Pending payslips for active staff without one. payload: { month, ids: {staffId: newEntryId} } */
export function runPayrollForMonth(ctx, { month, ids }) {
  const created = getStaff()
    .filter((x) => isActive(x) && !getPayslip(x.id, month))
    .map((x) => ({
      id: ids[x.id], staffId: x.id, month, gross: (x.salary || 0) + (x.allowances || 0), bonus: 0,
      deductions: Math.round((x.salary || 0) * 0.12), status: "Pending", paidOn: null,
    }));
  payroll.saveAll([...getPayroll(), ...created]);
  addLog(ctx);
}

export function togglePayslipPaid(ctx, { entryId }) {
  payroll.update(entryId, (e) => {
    e.status = e.status === "Paid" ? "Pending" : "Paid";
    e.paidOn = e.status === "Paid" ? ctx.date : null;
  });
  addLog(ctx);
}

export function adjustPayslip(ctx, { entryId, bonus, deductions, note }) {
  payroll.update(entryId, { bonus, deductions, note });
  addLog(ctx);
}
