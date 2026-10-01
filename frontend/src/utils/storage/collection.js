// Generic localStorage-backed list: get / find / add / update / delete with
// plain array methods. Every entity util (projectUtils, taskUtils, …) is built
// on this so the CRUD logic exists once.
import { ensureCrmStorage } from "./crmStorage";
import { getStorage, setStorage } from "./storage";

/**
 * `updates` is either an object (shallow-merged) or a function that receives a
 * deep copy of the item and may change it in place or return a new item.
 * The stored item is never mutated, so React sees a new reference.
 */
export const applyUpdates = (item, updates) => {
  if (typeof updates !== "function") return { ...item, ...updates };
  const copy = structuredClone(item);
  return updates(copy) ?? copy;
};

/**
 * @param {string} key   storage key (data/storageKeys.js)
 * @param {Array} defaults  initial data from data/ used when nothing is stored
 */
export function createCollection(key, defaults = []) {
  const getAll = () => {
    ensureCrmStorage();
    return getStorage(key, defaults);
  };
  const saveAll = (items) => {
    setStorage(key, items);
    return items;
  };

  return {
    getAll,
    saveAll,
    getById: (id) => getAll().find((x) => x.id === id),
    filter: (predicate) => getAll().filter(predicate),
    some: (predicate) => getAll().some(predicate),
    add: (item) => saveAll([...getAll(), item]),
    update: (id, updates) => saveAll(getAll().map((x) => (x.id === id ? applyUpdates(x, updates) : x))),
    /** Update every item matching `predicate`. */
    updateWhere: (predicate, updates) => saveAll(getAll().map((x) => (predicate(x) ? applyUpdates(x, updates) : x))),
    remove: (id) => saveAll(getAll().filter((x) => x.id !== id)),
  };
}

/** Same idea for a stored plain object (rules, signoffs). */
export function createRecord(key, defaults = {}) {
  const get = () => {
    ensureCrmStorage();
    return getStorage(key, defaults);
  };
  return {
    get,
    set: (field, value) => setStorage(key, { ...get(), [field]: value }),
  };
}
