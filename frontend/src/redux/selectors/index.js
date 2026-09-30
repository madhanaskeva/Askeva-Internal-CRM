// Memoised selectors. `selectData` is the role-scoped dataset every page should
// read from: a Project Manager only sees their own projects (and the tasks,
// follow-ups, CRs, bugs and releases belonging to them), exactly as in the original.
import { createSelector } from "@reduxjs/toolkit";
import { TOP_ROLES } from "../../constants/crm";
import { buildAlerts } from "../../utils/domain/alerts";
import { buildFinMap, portfolioTotals, roleRate } from "../../utils/domain/finance";
import { buildHealthMap } from "../../utils/domain/health";
import { buildDeadlineRow, buildFinRow } from "../../utils/domain/rows";
import { actorName } from "../../utils/domain/tasks";

/** Unscoped dataset — settings, syslog, staff admin and role switching use this. */
export const selectFullData = (s) => s.crm;
export const selectSession = (s) => s.session;
export const selectRole = (s) => s.session.role;
export const selectUi = (s) => s.ui;

export const selectIsTop = (s) => TOP_ROLES.includes(s.session.role);

/** strictGates rule (defaults to on). */
export const selectStrict = (s) => (s.crm.rules || {}).strictGates ?? true;

export const selectRules = (s) => s.crm.rules || {};

export const selectActiveStaff = createSelector(selectFullData, (d) => (d.staff || []).filter((x) => x.status === "Active"));

export const selectPms = createSelector(selectFullData, (d) => (d.staff || []).filter((x) => x.role === "Project Manager" && x.status === "Active"));

/** Display name of the acting user (history / audit actor). */
export const selectMe = createSelector([selectSession, selectFullData], (session, data) => actorName(session, data));

export const selectData = createSelector([selectFullData, selectSession], (full, { role, pmId }) => {
  if (role !== "PM") return full;
  const staff = full.staff || [];
  const pm = staff.find((x) => x.id === pmId) || staff.find((x) => x.role === "Project Manager");
  if (!pm) return full;
  const ids = new Set(full.projects.filter((p) => p.pmId === pm.id).map((p) => p.id));
  const mine = (x) => ids.has(x.projectId);
  return {
    ...full,
    projects: full.projects.filter((p) => ids.has(p.id)),
    tasks: full.tasks.filter(mine),
    followups: full.followups.filter(mine),
    crs: full.crs.filter(mine),
    bugs: full.bugs.filter(mine),
    releases: (full.releases || []).filter(mine),
  };
});

/** { [projectId]: health } — see utils/domain/health.js */
export const selectHealthMap = createSelector(selectData, buildHealthMap);

/** { [projectId]: finance } — see utils/domain/finance.js */
export const selectFinMap = createSelector(selectData, buildFinMap);

export const selectPortfolio = createSelector(selectFinMap, portfolioTotals);

export const selectAlerts = createSelector([selectData, selectHealthMap, selectFinMap], buildAlerts);

/** Finance row view-models for every visible project (Dashboard, Finance, Project detail). */
export const selectFinRows = createSelector([selectData, selectFinMap, selectHealthMap], (data, FIN, H) =>
  data.projects.map((p) => buildFinRow(p, FIN[p.id], H[p.id], (k) => roleRate(data, p, k))),
);

/** Deadline row view-models (Deadlines, Project detail). */
export const selectDeadlineRows = createSelector([selectData, selectHealthMap], (data, H) => data.projects.map((p) => buildDeadlineRow(p, H[p.id])));
