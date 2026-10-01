// Admin rules — ported from toggleStaff / removeStaff / setRule / resetDemo / runPayroll.
import { TOP_ROLES } from "../../data";
import { resetCrmStorage } from "../storage/crmStorage";
import { uid } from "../helpers/format";
import { runPayrollForMonth } from "../entities/payrollUtils";
import { getProjectsByPm } from "../entities/projectUtils";
import { setRuleValue } from "../entities/ruleUtils";
import { getStaff, getStaffById, removeStaffRecord, toggleStaffStatus } from "../entities/staffUtils";
import { hasOpenTasksFor } from "../entities/taskUtils";
import { done, refuse } from "./context";

export function toggleStaff(ctx, staffId) {
  const s = getStaffById(staffId);
  if (!s) return refuse();
  if (s.role === "Admin" && ctx.role !== "SuperAdmin") return refuse("Only the Super admin can deactivate an Admin.");
  toggleStaffStatus(ctx, { staffId });
  return done();
}

export function removeStaff(ctx, staffId) {
  const s = getStaffById(staffId);
  if (!s) return refuse();
  if (s.role === "Admin" && ctx.role !== "SuperAdmin") return refuse("Only the Super admin can remove an Admin.");
  if (hasOpenTasksFor(s.name) || getProjectsByPm(staffId).length) {
    return refuse("Cannot remove: open tasks or projects still point to this person. Deactivate instead or reassign first.");
  }
  removeStaffRecord(ctx, { staffId });
  return done();
}

export function setRule(ctx, key, value) {
  if (ctx.role !== "SuperAdmin") return refuse("Only the Super admin can change system rules.");
  setRuleValue(ctx, { key, value });
  return done();
}

/** Wipe saved data and reload the demo seed (Admin / Super admin). */
export function resetDemo(ctx) {
  if (!TOP_ROLES.includes(ctx.role)) return refuse();
  resetCrmStorage();
  return done({ message: "Demo data reset." });
}

export function runPayroll(ctx, month) {
  const ids = Object.fromEntries(getStaff().map((s) => [s.id, "pr" + uid()]));
  runPayrollForMonth(ctx, { month, ids });
  return done();
}
