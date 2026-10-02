// Read side of the CRM data for React: the whole dataset as one object, a
// role-scoped view of it, and memoised derived views (health, finance, alerts…).
// Everything here is built from the entity utils → localStorage. No Redux.
import { useSyncExternalStore } from "react";
import { DEV_ROLES, STORAGE_KEYS } from "../../data";
import { ensureCrmStorage, DATASETS } from "./crmStorage";
import { buildAlerts } from "../domain/alerts";
import { buildFinMap, portfolioTotals, roleRate } from "../domain/finance";
import { buildHealthMap } from "../domain/health";
import { buildDeadlineRow, buildFinRow } from "../domain/rows";
import { actorName, isMyTask } from "../domain/tasks";
import { getStorage, subscribeStorage } from "./storage";
import { getPms } from "../entities/staffUtils";
import { getRules, isStrict } from "../entities/ruleUtils";

/** Cache the last result per argument list (reference equality), like a memoised selector. */
export function memoLast(fn) {
  let lastArgs = null;
  let lastResult;
  return (...args) => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs[i])) return lastResult;
    lastArgs = args;
    lastResult = fn(...args);
    return lastResult;
  };
}

// ——— Whole dataset ———

const DATA_KEYS = new Set([...DATASETS.map(([, key]) => key), STORAGE_KEYS.META]);
let snapshot = null;
let parts = [];

/** Every dataset as one object: { projects, tasks, bugs, followups, crs, … }. Same object until something changes. */
export function getCrmData() {
  ensureCrmStorage();
  const next = DATASETS.map(([, key, empty]) => getStorage(key, empty));
  if (!snapshot || next.some((v, i) => v !== parts[i])) {
    parts = next;
    snapshot = Object.fromEntries(DATASETS.map(([prop], i) => [prop, next[i]]));
  }
  return snapshot;
}

const subscribeCrm = (onChange) => subscribeStorage((key) => {
  if (key === null || DATA_KEYS.has(key)) onChange();
});

/** React hook: the full dataset; re-renders whenever any dataset is written. */
export const useCrmData = () => useSyncExternalStore(subscribeCrm, getCrmData);

// ——— Role scoping ———

/**
 * A Project Manager only sees their own projects (and the tasks, follow-ups,
 * CRs, bugs and releases belonging to them); every other role sees everything.
 */
export const scopeData = memoLast((full, role, pmId, me) => {
  // Developers see only the tasks assigned to them (by name or their track's pool) and the bugs on them.
  if (DEV_ROLES.includes(role)) {
    const tasks = full.tasks.filter((t) => isMyTask(t, me));
    const ids = new Set(tasks.map((t) => t.id));
    return { ...full, tasks, bugs: full.bugs.filter((b) => b.developer === me || ids.has(b.taskId)) };
  }
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

// ——— Derived views (pass the scoped dataset) ———

/** { [projectId]: health } — see domain/health.js */
export const getHealthMap = memoLast(buildHealthMap);

/** { [projectId]: finance } — see domain/finance.js */
export const getFinMap = memoLast(buildFinMap);

export const getPortfolio = memoLast((data) => portfolioTotals(getFinMap(data)));

export const getAlerts = memoLast((data) => buildAlerts(data, getHealthMap(data), getFinMap(data)));

/** Finance row view-models for every visible project (Dashboard, Finance, Project detail). */
export const getFinRows = memoLast((data) => {
  const FIN = getFinMap(data);
  const H = getHealthMap(data);
  return data.projects.map((p) => buildFinRow(p, FIN[p.id], H[p.id], (k) => roleRate(data, p, k)));
});

/** Deadline row view-models (Deadlines, Project detail). */
export const getDeadlineRows = memoLast((data) => {
  const H = getHealthMap(data);
  return data.projects.map((p) => buildDeadlineRow(p, H[p.id]));
});

/** Active Project Managers from a dataset. */
export const getPmList = memoLast((full) => getPms(full.staff || []));

export const getRulesFrom = (full) => full.rules || getRules();
export const getStrictFrom = (full) => isStrict(full.rules);

/** Display name of the acting user (history / audit actor). */
export const getActorName = (session, full) => actorName(session, full);
