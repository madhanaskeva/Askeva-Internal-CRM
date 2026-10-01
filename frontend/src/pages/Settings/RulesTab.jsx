import { InputNumber } from "antd";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import { setRule } from "../../utils/actions/adminActions";
import { RULE_SETTINGS } from "../../data";
import { useAction } from "../../app/useCrm";

/** System rules — editable by the Super admin only; every change is logged. */
export default function RulesTab({ rules, isSuper }) {
  const run = useAction();
  return (
    <Card className="stack gap-8 set-card">
      <div className="row row--between row--wrap row--baseline gap-8">
        <span className="section-title__text">System rules</span>
        <span className="meta">{isSuper ? "Changes apply immediately and are logged." : "Read-only — only the Super admin can change system rules."}</span>
      </div>
      {RULE_SETTINGS.map(([k, label, help, kind]) => (
        <div key={k} className="set-rule">
          <div className="flex-1">
            <strong className="fs-12">{label}</strong>
            <div className="fs-11 text-body">{help}</div>
          </div>
          {kind === "bool" ? (
            <PillButton size="xxs" tone={rules[k] ? "green" : "white"} className="set-rule__toggle" disabled={!isSuper} onClick={() => run(setRule, k, !rules[k])}>
              {rules[k] ? "ON" : "OFF"}
            </PillButton>
          ) : (
            <InputNumber
              size="small"
              className="brand-input set-rule__num"
              value={rules[k] ?? null}
              disabled={!isSuper}
              onChange={(v) => run(setRule, k, Number(v) || 0)}
            />
          )}
        </div>
      ))}
    </Card>
  );
}
