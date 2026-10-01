// System rules (Settings → System rules) and daily-audit sign-offs.
import { DEFAULT_RULES, STORAGE_KEYS } from "../../data";
import { createRecord } from "../storage/collection";
import { addLog } from "./syslogUtils";

const rules = createRecord(STORAGE_KEYS.RULES, DEFAULT_RULES);
const signoffs = createRecord(STORAGE_KEYS.SIGNOFFS, {});

export const getRules = rules.get;
/** strictGates rule (defaults to on). */
export const isStrict = (r = getRules()) => (r || {}).strictGates ?? true;

export function setRuleValue(ctx, { key, value }) {
  rules.set(key, value);
  addLog(ctx, "Rule changed · " + key + " = " + value);
}

export const getSignoffs = signoffs.get;

/** Daily audit sign-off. payload: { key: "Person|yyyy-mm-dd", who: "pc"|"pm" } */
export function signAudit(ctx, { key, who }) {
  signoffs.set(key, { ...(getSignoffs()[key] || {}), [who]: true, [who + "On"]: ctx.date });
  addLog(ctx);
}
