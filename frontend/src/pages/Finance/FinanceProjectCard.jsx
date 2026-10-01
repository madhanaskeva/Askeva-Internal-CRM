import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/cx";
import { useAction } from "../../app/useCrm";
import { acknowledgeOverrun, addEffortDay, removeExpense, toggleInvoice } from "../../utils/entities/projectUtils";

function Metric({ label, value, valueColor = "ink", children }) {
  return (
    <div className="fin-metric">
      <div className="label-caps fin-metric__label">{label}</div>
      <div className={`fin-metric__value text-${valueColor}`}>{value}</div>
      <div className="fin-metric__sub">{children}</div>
    </div>
  );
}

function Panel({ title, action, onAction, children }) {
  return (
    <div className="fin-panel">
      <div className="fin-panel__head">
        <span className="label-caps fw-700 text-ink">{title}</span>
        <PillButton size="xxs" onClick={onAction}>{action}</PillButton>
      </div>
      {children}
    </div>
  );
}

/** One project's finance card — port of a `finRows` item in the original FINANCE view. */
export default function FinanceProjectCard({ row: r }) {
  const dispatch = useDispatch();
  const run = useAction();
  const navigate = useNavigate();
  const projectId = r.id;
  const openModal = (kind) => dispatch(modalOpened({ kind, extra: { projectId } }));
  const ov = r.overrun;

  return (
    <Card flush>
      <div className="fin-head">
        <button type="button" className="link-block fin-head__title" onClick={() => navigate(pathFor("detail", { projectId }))}>
          <span className="font-display fin-head__client text-ink">{r.client}</span>
          <span className="mono-meta">{r.code} · {r.billing} billing · {r.stage}</span>
        </button>
        <Pill tone={r.healthTone}>{r.health}</Pill>
      </div>

      <div className="fin-metrics">
        <Metric label="Revenue" value={r.revenue}>
          {r.hasCrRev && <span className="text-green">{r.crRevLabel}</span>}
        </Metric>
        <Metric label="Staff cost · actual" value={r.staffActual} valueColor={r.burnColor}>
          {r.staffPlan}
        </Metric>
        <div className="fin-metrics__pl tone-ink800">
          <div className="label-caps text-lime">Forecast P&amp;L</div>
          <div className="fin-metrics__pl-value">{r.forecastPL}</div>
          <div className="fin-metric__sub text-meta mt-3">{r.margin} margin</div>
          <div className="fin-metric__sub text-meta">cash P&amp;L {r.cashPL}</div>
        </div>
        <Metric label="Expenses" value={r.expenses}>non-staff costs</Metric>
        <Metric label="Received" value={r.received}>
          <span className={`text-${r.dueColor}`}>{r.due} due {r.overdueInvLabel}</span>
        </Metric>
      </div>

      {r.isOverrun && (
        <div className="fin-overrun tone-rose">
          <Pill size="xs" tone={r.overrunTone}>Overrun · {r.overrunStatus}</Pill>
          {ov ? (
            <span className="fin-overrun__text text-ink">{r.overrunText}</span>
          ) : (
            <span className="fin-overrun__text text-body">Actual staff cost exceeds plan — PC must log the cause.</span>
          )}
          <PillButton size="xxs" onClick={() => openModal("overrun")}>Log / edit reason</PillButton>
          {ov && !ov.ack && (
            <PillButton size="xxs" tone="green" onClick={() => run(acknowledgeOverrun, { projectId })}>
              PM acknowledge
            </PillButton>
          )}
        </div>
      )}

      <div className="fin-panels">
        <Panel title="Invoices & payments" action="+ Invoice" onAction={() => openModal("invoice")}>
          {r.invoices.map((i) => (
            <div key={i.id} className="fin-line fin-line--invoice">
              <div className="flex-1">
                <div className="ellipsis fw-600 text-ink">{i.label}</div>
                <div className="fs-10 text-muted">{i.date}</div>
              </div>
              <span className="font-mono fs-11 text-ink">{i.amount}</span>
              <button
                type="button"
                title="Toggle received"
                className={cx("pill pill--xs pill-btn fin-inv-status", `tone-${i.tone}`)}
                onClick={() => run(toggleInvoice, { projectId, invoiceId: i.id })}
              >
                {i.status}
              </button>
            </div>
          ))}
        </Panel>

        <Panel title="Staff effort & cost" action="+ Log days" onAction={() => openModal("effort")}>
          {r.unapprovedDays > 0 && (
            <div className="fin-unapproved text-danger fw-600">{r.unapprovedDays} days on unapproved CRs — unbilled</div>
          )}
          {r.effortRows.map((e) => (
            <div key={e.key} className="fin-line fin-line--effort">
              <div className="flex-1">
                <div className="ellipsis fw-600 text-ink">
                  {e.role} <span className="fin-effort__name">· {e.name}</span>
                </div>
                <ProgressBar pct={e.pct} height={3} fill={e.over ? "danger" : "ink"} className="mt-4" />
              </div>
              <span className={`font-mono fin-num text-${e.over ? "danger" : "ink"}`}>{e.label}</span>
              <span className="font-mono fin-num text-muted">{e.cost}</span>
              <button
                type="button"
                title="+1 day"
                className="fin-round-btn tone-lime fw-700"
                onClick={() => run(addEffortDay, { projectId, key: e.key })}
              >
                +1
              </button>
            </div>
          ))}
        </Panel>

        <Panel title="Expenses" action="+ Expense" onAction={() => openModal("expense")}>
          {r.expenseRows.map((x) => (
            <div key={x.id} className="fin-line fin-line--expense">
              <div className="flex-1">
                <div className="ellipsis fw-600 text-ink">{x.desc}</div>
                <div className="fs-10 text-muted">{x.category} · {x.date}</div>
              </div>
              <span className="font-mono fs-11 text-ink">{x.amount}</span>
              <button
                type="button"
                title="Remove"
                className="fin-round-btn tone-white"
                onClick={() => run(removeExpense, { projectId, expenseId: x.id })}
              >
                ✕
              </button>
            </div>
          ))}
        </Panel>
      </div>
    </Card>
  );
}
