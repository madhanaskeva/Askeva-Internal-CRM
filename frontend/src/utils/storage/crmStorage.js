// First-load setup of the per-dataset localStorage keys.
//
//   First load:  saved blob from an older version (v2 → v1)  or  seed() from data/
//                → migrations → one localStorage key per dataset
//   Later loads: read straight from those keys (utils/entities/*Utils.js)
import { LEGACY_STORAGE_KEY, STORAGE_KEY, STORAGE_KEYS } from "../../data";
import { migrateData } from "./migrations";
import { seed } from "./seed";
import { getStorage, removeStorage, setStorage } from "./storage";

/** Dataset property ↔ storage key ↔ empty value. */
export const DATASETS = [
  ["projects", STORAGE_KEYS.PROJECTS, []],
  ["tasks", STORAGE_KEYS.TASKS, []],
  ["bugs", STORAGE_KEYS.BUGS, []],
  ["followups", STORAGE_KEYS.FOLLOWUPS, []],
  ["crs", STORAGE_KEYS.CHANGE_REQUESTS, []],
  ["clientCommunications", STORAGE_KEYS.COMMUNICATIONS, []],
  ["staff", STORAGE_KEYS.STAFF, []],
  ["payroll", STORAGE_KEYS.PAYROLL, []],
  ["releases", STORAGE_KEYS.RELEASES, []],
  ["clientAccounts", STORAGE_KEYS.CLIENT_ACCOUNTS, []],
  ["syslog", STORAGE_KEYS.SYSLOG, []],
  ["rules", STORAGE_KEYS.RULES, {}],
  ["signoffs", STORAGE_KEYS.SIGNOFFS, {}],
];

let ready = false;

/** Make sure every dataset key exists. Cheap after the first call. */
export function ensureCrmStorage() {
  if (ready) return;
  ready = true;
  if (getStorage(STORAGE_KEYS.META)?.initialized) return;

  const data = getStorage(STORAGE_KEY) || getStorage(LEGACY_STORAGE_KEY) || seed();
  const blob = structuredClone(data); // never mutate the cached value
  migrateData(blob);

  const meta = { ...blob, initialized: true };
  DATASETS.forEach(([prop, key, empty]) => {
    setStorage(key, blob[prop] ?? empty);
    delete meta[prop];
  });
  setStorage(STORAGE_KEYS.META, meta);
  // The v2 blob is now split into the keys above.
  removeStorage(STORAGE_KEY);
}

/** Wipe every dataset and rebuild from the legacy v1 blob or the demo seed. */
export function resetCrmStorage() {
  DATASETS.forEach(([, key]) => removeStorage(key));
  removeStorage(STORAGE_KEYS.META);
  removeStorage(STORAGE_KEY);
  ready = false;
  ensureCrmStorage();
}
