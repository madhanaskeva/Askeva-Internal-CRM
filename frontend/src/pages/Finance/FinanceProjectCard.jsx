import { useMemo } from "react";
import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
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

function Panel({ title, isHighlighted, children }) {
  return (
    <div className={cx("fin-panel", isHighlighted && "fin-panel--highlight")}>
      <div className="fin-panel__head">
        <span className="label-caps fw-700 text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}

/** One project's finance card — port of a `finRows` item in the original FINANCE view. */
export default function FinanceProjectCard({ row: r, activeFilter = "all" }) {
  const dispatch = useDispatch();
  const run = useAction();
  const navigate = useNavigate();
  const projectId = r.id;
  const openModal = (kind) => dispatch(modalOpened({ kind, extra: { projectId } }));
  const ov = r.overrun;

  const [filterCat, filterVal] = (activeFilter || "").split(":");

  const visibleInvoices = useMemo(() => {
    if (filterCat !== "invoice" || filterVal === "all") return r.invoices;
    if (filterVal === "overdue") return r.invoices.filter((i) => i.status.toLowerCase() === "overdue");
    if (filterVal === "due") return r.invoices.filter((i) => i.status.toLowerCase() === "due");
    if (filterVal === "received") return r.invoices.filter((i) => i.status.toLowerCase() === "received");
    return r.invoices;
  }, [r.invoices, filterCat, filterVal]);

  const visibleEffort = useMemo(() => {
    if (filterCat !== "logdays" || filterVal === "all") return r.effortRows;
    if (filterVal === "over_budget") return r.effortRows.filter((e) => e.over);
    if (filterVal === "has_effort") return r.effortRows.filter((e) => e.pct > 0);
    if (["ui", "backend", "tester", "pc"].includes(filterVal)) {
      return r.effortRows.filter((e) => e.key === filterVal);
    }
    return r.effortRows;
  }, [r.effortRows, filterCat, filterVal]);

  const visibleExpenses = useMemo(() => {
    if (filterCat !== "expense" || filterVal === "all" || filterVal === "has_expense") return r.expenseRows;
    return r.expenseRows.filter((x) => x.category.toLowerCase().includes(filterVal.toLowerCase()));
  }, [r.expenseRows, filterCat, filterVal]);

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
        <Panel title="Invoices & payments" isHighlighted={filterCat === "invoice"}>
          {visibleInvoices.length > 0 ? (
            visibleInvoices.map((i) => (
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
            ))
          ) : (
            <div className="p-8 fs-11 text-muted text-center">No matching invoices</div>
          )}
        </Panel>

        <Panel title="Staff effort & cost" isHighlighted={filterCat === "logdays"}>
          {r.unapprovedDays > 0 && (
            <div className="fin-unapproved text-danger fw-600">{r.unapprovedDays} days on unapproved CRs — unbilled</div>
          )}
          {visibleEffort.length > 0 ? (
            visibleEffort.map((e) => (
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
            ))
          ) : (
            <div className="p-8 fs-11 text-muted text-center">No matching log days</div>
          )}
        </Panel>

        <Panel title="Expenses" isHighlighted={filterCat === "expense"}>
          {visibleExpenses.length > 0 ? (
            visibleExpenses.map((x) => (
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
            ))
          ) : (
            <div className="p-8 fs-11 text-muted text-center">No matching expenses</div>
          )}
        </Panel>
      </div>
    </Card>
  );
}
