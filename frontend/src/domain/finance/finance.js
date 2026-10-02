// Project finance — port of `staffRate`, `roleRate`, `fin(p)` and the portfolio roll-up.
import { TODAY, daysBetween } from "../../utils/date";
import { parseAmount } from "../../utils/format";

/** Real day rate of a staff member: (salary + allowances) / working days. */
export const staffRate = (s) => (s ? Math.round(((s.salary || 0) + (s.allowances || 0)) / (s.workDays || 22)) : null);

const staffByName = (data, n) => (data.staff || []).find((s) => s.name === n);

/** Team member name for an effort role key (ui/backend/tester/pc). */
export const teamOf = (p, roleKey) => (roleKey === "pc" ? "PC" : (p.team || {})[roleKey]);

/** Day rate for a project role — the assigned person's real rate, falling back to the budget rate. */
export const roleRate = (data, p, k) => staffRate(staffByName(data, teamOf(p, k))) || (p.budget || {}).dayRate || 0;

export function computeFin(p, data) {
  const b = p.budget || {};
  const e = p.effort || {};
  const rate = b.dayRate || 0;
  const rr = (k) => roleRate(data, p, k);
  const plannedStaffReal = (b.uiDays || 0) * rr("ui") + (b.backendDays || 0) * rr("backend") + (b.testDays || 0) * rr("tester") + (b.pcDays || 0) * rr("pc");
  const actualStaffReal = (e.ui || 0) * rr("ui") + (e.backend || 0) * rr("backend") + (e.tester || 0) * rr("tester") + (e.pc || 0) * rr("pc");
  const price = parseAmount(p.cost);
  const crRev = data.crs.filter((c) => c.projectId === p.id && c.status === "Approved").reduce((s, c) => s + parseAmount(c.cost), 0);
  const revenue = price + crRev;
  const inv = p.invoices || [];
  const received = inv.filter((i) => i.status === "Received").reduce((s, i) => s + i.amount, 0);
  const due = inv.filter((i) => i.status !== "Received").reduce((s, i) => s + i.amount, 0);
  const overdueInv = inv.filter((i) => i.status !== "Received" && daysBetween(i.date, TODAY) < 0);
  const plannedDays = (b.uiDays || 0) + (b.backendDays || 0) + (b.testDays || 0) + (b.pcDays || 0);
  const actualDays = (e.ui || 0) + (e.backend || 0) + (e.tester || 0) + (e.pc || 0);
  const plannedStaff = plannedStaffReal || plannedDays * rate;
  const actualStaff = actualStaffReal || actualDays * rate;
  const expenses = (p.expenses || []).reduce((s, x) => s + x.amount, 0);
  const plannedCost = plannedStaff + expenses;
  const actualCost = actualStaff + expenses;
  const forecastCost = Math.max(plannedStaff, actualStaff) + expenses;
  const plannedPL = revenue - plannedCost;
  const forecastPL = revenue - forecastCost;
  const cashPL = received - actualCost;
  const margin = revenue ? Math.round((forecastPL / revenue) * 100) : null;
  const burn = plannedStaff ? Math.round((actualStaff / plannedStaff) * 100) : 0;
  return { price, crRev, revenue, received, due, overdueInv, plannedDays, actualDays, plannedStaff, actualStaff, expenses, plannedCost, actualCost, forecastCost, plannedPL, forecastPL, cashPL, margin, burn, rate };
}

export function buildFinMap(data) {
  const FIN = {};
  data.projects.forEach((p) => (FIN[p.id] = computeFin(p, data)));
  return FIN;
}

const PORT_KEYS = ["revenue", "received", "due", "plannedStaff", "actualStaff", "expenses", "forecastCost", "forecastPL", "cashPL", "plannedDays", "actualDays"];

/** Portfolio totals across all projects + margin %. */
export function portfolioTotals(FIN) {
  const port = Object.fromEntries(PORT_KEYS.map((k) => [k, 0]));
  Object.values(FIN).forEach((f) => PORT_KEYS.forEach((k) => (port[k] += f[k])));
  port.margin = port.revenue ? Math.round((port.forecastPL / port.revenue) * 100) : 0;
  return port;
}
