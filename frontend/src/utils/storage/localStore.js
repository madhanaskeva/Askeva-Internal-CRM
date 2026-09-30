// localStorage persistence — same keys and fallback order as the original app,
// so data saved by the HTML version is picked up by the React version.
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from "../../constants/crm";
import { seed } from "../../data/seed";
import { migrateData } from "./migrations";

const SESSION_KEY = "askeva-crm-session";

const readJson = (storage, key) => {
  try {
    return JSON.parse(storage.getItem(key));
  } catch {
    return null;
  }
};

export function saveCrmData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode) — the app keeps working in memory.
  }
}

/** Load v2 → fall back to v1 → fall back to seed, then run migrations. */
export function loadCrmData() {
  const data = readJson(localStorage, STORAGE_KEY) || readJson(localStorage, LEGACY_STORAGE_KEY) || seed();
  if (migrateData(data)) saveCrmData(data);
  return data;
}

export function clearCrmData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Signed-in role survives a page refresh within the tab (sessionStorage). */
export const loadSession = () => readJson(sessionStorage, SESSION_KEY);

export function saveSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}
