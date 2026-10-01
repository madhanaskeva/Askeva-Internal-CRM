// Staff records and the reporting structure.
import { STORAGE_KEYS, staff as defaultStaff } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const staff = createCollection(STORAGE_KEYS.STAFF, defaultStaff);

export const getStaff = staff.getAll;
export const getStaffById = staff.getById;
export const isActive = (x) => x.status === "Active";
export const getActiveStaff = () => staff.filter(isActive);
/** Active Project Managers. */
export const getPms = (list = getStaff()) => list.filter((x) => x.role === "Project Manager" && isActive(x));

/** Add or edit a full staff record. payload: { staffId?, newId, record } */
export function saveStaff(ctx, { staffId, newId, record }) {
  if (staffId) staff.update(staffId, record);
  else staff.add({ id: newId, status: "Active", ...record });
  addLog(ctx, staffId ? "Edited staff record · " + record.name : "Added staff · " + record.name);
}

export function toggleStaffStatus(ctx, { staffId }) {
  const x = getStaffById(staffId);
  const wasActive = isActive(x);
  staff.update(staffId, { status: wasActive ? "Inactive" : "Active" });
  addLog(ctx, (wasActive ? "Deactivated " : "Reactivated ") + x.name);
}

/** Remove a person; anyone reporting to them moves to "no manager". */
export function removeStaffRecord(ctx, { staffId }) {
  const name = (getStaffById(staffId) || {}).name;
  staff.saveAll(
    getStaff()
      .filter((x) => x.id !== staffId)
      .map((x) => (x.reportsTo === staffId ? { ...x, reportsTo: null } : x)),
  );
  addLog(ctx, "Removed staff · " + name);
}

export function setReportsTo(ctx, { staffId, to }) {
  if (getStaffById(staffId)) staff.update(staffId, { reportsTo: to || null });
  addLog(ctx, "Changed reporting line");
}
