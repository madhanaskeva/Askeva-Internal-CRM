// System rules: defaults and the Settings → System rules form.

export const DEFAULT_RULES = { strictGates: true, sameDayAccept: true, uiPhaseDays: 10, marginThreshold: 20, redesignLimit: 2, bugAgeRed: 3, prodNeedsClient: true };

/** [key, label, help, kind] rows shown in Settings → System rules. */
export const RULE_SETTINGS = [
  ["strictGates", "Strict gates", "Enforce stage gates, CR email and task rules. Off = overrides allowed but logged.", "bool"],
  ["sameDayAccept", "Same-day acceptance", "Developers must accept allocations the same day; late → L2 alert.", "bool"],
  ["prodNeedsClient", "Client approval required for production", "Include client demo acceptance in the five production gates.", "bool"],
  ["uiPhaseDays", "UI phase commitment (days)", "Committed UI phase length; beyond this the UI-phase counter turns red.", "num"],
  ["marginThreshold", "Margin threshold (%)", "Forecast margin below this raises an L2 alert.", "num"],
  ["redesignLimit", "Redesign rounds included", "Beyond this the PM + client discussion is required.", "num"],
  ["bugAgeRed", "Bug age red flag (days)", "Open bugs older than this are shown red in QA.", "num"],
];
