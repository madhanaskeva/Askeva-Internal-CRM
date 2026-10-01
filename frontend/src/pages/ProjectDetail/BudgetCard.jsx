import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { TODAY, daysBetween } from "../../utils/helpers/date";
import { inr, parseAmount } from "../../utils/helpers/format";

/** Team & budget view-model — port of the original `d.tb`. */
function teamBudget(p) {
  const b = p.budget || {};
  const days = (b.uiDays || 0) + (b.backendDays || 0) + (b.testDays || 0) + (b.pcDays || 0);
  const internal = days * (b.dayRate || 0);
  const price = parseAmount(p.cost);
  const margin = price ? Math.round(((price - internal) / price) * 100) : null;

  return {
    totalDays: days + " man-days",
    internal: inr(internal),
    rate: inr(b.dayRate || 0) + " / day",
    marginLabel: margin == null ? "—" : margin + "% gross margin",
    marginColor: margin == null ? "muted" : margin < 30 ? "danger" : "green",
    burn: `${Math.max(0, daysBetween(TODAY, p.start))} calendar days elapsed of ${Math.max(1, daysBetween(p.deadline, p.start))}`,
  };
}

function Tile({ label, value, sub, tone = "paper", valueClass = "text-ink", labelClass = "text-muted", small }) {
  return (
    <div className={`pd-tile tone-${tone}`}>
      <div className={`pd-tile__label ${labelClass}`}>{label}</div>
      <div className={`font-display ${small ? "pd-tile__value--sm" : "pd-tile__value"} ${valueClass}`}>{value}</div>
      {sub && <div className="meta">{sub}</div>}
    </div>
  );
}

/** Budget, cost burn and quick finance actions. */
export default function BudgetCard({ p, fin }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const tb = teamBudget(p);
  const open = (kind) => dispatch(modalOpened({ kind, extra: { projectId: p.id } }));

  return (
    <Card className="pd-card">
      <div className="stack gap-8">
        <div className="label-caps fw-700 text-ink">Budget</div>
        <div className="grid-2 pd-tiles">
          <Tile label="Planned effort" value={tb.totalDays} sub={`@ ${tb.rate}`} />
          <Tile label="Internal cost" value={tb.internal} sub="effort × day rate" />
          <Tile label="Project price" value={p.cost} tone="ink800" valueClass="text-paper" labelClass="text-lime" />
          <Tile label="Margin" value={tb.marginLabel} tone="white" valueClass={`text-${tb.marginColor}`} />
        </div>
        {fin && (
          <div className="grid-2 pd-tiles">
            <Tile label="Staff cost actual / plan" value={fin.staffLabel} sub={fin.burnLabel} valueClass={`text-${fin.burnColor}`} small />
            <Tile label="Expenses · Forecast P&L" value={`${fin.expenses} · ${fin.forecastPL}`} sub={`received ${fin.received} · due ${fin.due}`} valueClass={`text-${fin.plColor}`} small />
          </div>
        )}
        <div className="row row--wrap gap-8">
          <PillButton size="sm" className="pd-shadow-btn" onClick={() => open("effort")}>+ Log days</PillButton>
          <PillButton size="sm" className="pd-shadow-btn" onClick={() => open("expense")}>+ Expense</PillButton>
          <PillButton size="sm" className="pd-shadow-btn" onClick={() => open("invoice")}>+ Invoice</PillButton>
          <PillButton size="sm" tone="ink" onClick={() => navigate(pathFor("finance"))}>Full P&amp;L →</PillButton>
        </div>
        <div className="meta pd-meta">{tb.burn}</div>
        {p.billing === "Resource" && (
          <div className="pd-resource-note">Resource billing — attendance log is the invoice basis; share with client on request.</div>
        )}
      </div>
    </Card>
  );
}
