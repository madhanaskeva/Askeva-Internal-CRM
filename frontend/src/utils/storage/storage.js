// Centralized localStorage / sessionStorage access — the only file that touches
// the browser storage APIs.
//
// Parsed localStorage values are cached in memory, so repeated reads return the
// same object (cheap, and lets React detect changes by reference). Writes update
// the cache and notify subscribers (see utils/storage/crmData.js → useCrmData).

const cache = new Map();
const listeners = new Set();

const notify = (key) => listeners.forEach((fn) => fn(key));

export const getStorage = (key, fallback = null) => {
  if (cache.has(key)) return cache.get(key) ?? fallback;
  try {
    const value = localStorage.getItem(key);
    const parsed = value ? JSON.parse(value) : null;
    cache.set(key, parsed);
    return parsed ?? fallback;
  } catch (error) {
    console.error("Error reading localStorage:", error);
    return fallback;
  }
};

export const setStorage = (key, value) => {
  cache.set(key, value);
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage full or blocked (private mode) — the value still lives in memory.
    console.error("Error writing localStorage:", error);
  }
  notify(key);
};

export const removeStorage = (key) => {
  cache.delete(key);
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing localStorage:", error);
  }
  notify(key);
};

export const clearStorage = () => {
  cache.clear();
  try {
    localStorage.clear();
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
  notify(null);
};

/** Subscribe to writes: fn(key) runs after every set/remove (key null = everything). Returns unsubscribe. */
export const subscribeStorage = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// Another tab changed storage → drop the cached value and re-render.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.storageArea !== localStorage) return;
    if (e.key === null) cache.clear();
    else cache.delete(e.key);
    notify(e.key);
  });
}

export const getSessionStorage = (key, fallback = null) => {
  try {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Error reading sessionStorage:", error);
    return fallback;
  }
};

export const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing sessionStorage:", error);
  }
};
