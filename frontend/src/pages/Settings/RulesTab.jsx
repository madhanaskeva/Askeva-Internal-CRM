import { InputNumber } from "antd";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import { setRule } from "../../utils/actions/adminActions";

/** [key, label, help, kind] — the configurable system rules. */
const RULES = [
  ["strictGates", "Strict gates", "Enforce stage gates, CR email and task rules. Off = overrides allowed but logged.", "bool"],
  ["sameDayAccept", "Same-day acceptance", "Developers must accept allocations the same day; late → L2 alert.", "bool"],
  ["prodNeedsClient", "Client approval required for production", "Include client demo acceptance in the five production gates.", "bool"],
  ["uiPhaseDays", "UI phase commitment (days)", "Committed UI phase length; beyond this the UI-phase counter turns red.", "num"],
  ["marginThreshold", "Margin threshold (%)", "Forecast margin below this raises an L2 alert.", "num"],
  ["redesignLimit", "Redesign rounds included", "Beyond this the PM + client discussion is required.", "num"],
  ["bugAgeRed", "Bug age red flag (days)", "Open bugs older than this are shown red in QA.", "num"],
];

/** System rules — editable by the Super admin only; every change is logged. */
export default function RulesTab({ rules, isSuper }) {
  return (
    <Card className="stack gap-8 set-card">
      <div className="row row--between row--wrap row--baseline gap-8">
        <span className="section-title__text">System rules</span>
        <span className="meta">{isSuper ? "Changes apply immediately and are logged." : "Read-only — only the Super admin can change system rules."}</span>
      </div>
      {RULES.map(([k, label, help, kind]) => (
        <div key={k} className="set-rule">
          <div className="flex-1">
            <strong className="fs-12">{label}</strong>
            <div className="fs-11 text-body">{help}</div>
          </div>
          {kind === "bool" ? (
            <PillButton size="xxs" tone={rules[k] ? "green" : "white"} className="set-rule__toggle" disabled={!isSuper} onClick={() => setRule(k, !rules[k])}>
              {rules[k] ? "ON" : "OFF"}
            </PillButton>
          ) : (
            <InputNumber
              size="small"
              className="brand-input set-rule__num"
              value={rules[k] ?? null}
              disabled={!isSuper}
              onChange={(v) => setRule(k, Number(v) || 0)}
            />
          )}
        </div>
      ))}
    </Card>
  );
}
