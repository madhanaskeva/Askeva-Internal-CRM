import StackedBar from "../../components/charts/StackedBar";
import Card from "../../components/common/Card";
import { cx } from "../../utils/helpers/cx";
import { hPct, wPct } from "../../utils/helpers/pct";

const ChartCard = ({ title, children }) => (
  <Card className="stack gap-10 pl-card">
    <div className="section-title__text">{title}</div>
    {children}
  </Card>
);

/** Horizontal revenue vs forecast-cost bars per project. */
export function RevenueBars({ bars }) {
  return (
    <ChartCard title="Revenue vs forecast cost">
      {bars.map((b) => (
        <div key={b.id} className="stack gap-4">
          <div className="row row--between fs-11">
            <strong>{b.client}</strong>
            <span className={`fw-700 text-${b.marginColor}`}>{b.margin}</span>
          </div>
          <div className="row gap-6">
            <div className={cx("pl-hbar tone-green", wPct(b.revW))} />
            <span className="mono-meta">{b.revLabel}</span>
          </div>
          <div className="row gap-6">
            <div className={cx("pl-hbar tone-ink", wPct(b.costW))} />
            <span className="mono-meta">{b.costLabel}</span>
          </div>
        </div>
      ))}
      <div className="row gap-12 fs-10 text-muted">
        <span><span className="legend-dot tone-green" /> revenue incl. approved CRs</span>
        <span><span className="legend-dot tone-ink" /> forecast cost</span>
      </div>
    </ChartCard>
  );
}

/** Vertical revenue/cost columns per month with margin % on top. */
export function MarginTrend({ trend }) {
  return (
    <ChartCard title="Margin trend · by month">
      <div className="pl-trend">
        {trend.map((m) => (
          <div key={m.key} className="pl-trend__col">
            <span className={`fs-11 fw-700 text-${m.color}`}>{m.marginLabel}</span>
            <div className="pl-trend__bars">
              <div title={m.revLabel} className={cx("pl-vbar pl-vbar--rev", hPct(m.revH))} />
              <div title={m.costLabel} className={cx("pl-vbar pl-vbar--cost", hPct(m.costH))} />
            </div>
            <span className="mono-meta">{m.label}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/** Cost split (productive salary / rework / expenses) + CR revenue vs scope creep. */
export function CostBreakdown({ pl }) {
  return (
    <ChartCard title="Cost breakdown">
      <StackedBar segments={pl.costBreak.map((c) => ({ key: c.key, pct: c.pct, tone: c.tone }))} height={16} />
      {pl.costBreak.map((c) => (
        <div key={c.key} className="pl-line">
          <span className="row gap-6">
            <span className={`legend-dot tone-${c.tone}`} />
            {c.label}
          </span>
          <span className="num-cell">{c.value} · {c.pct}%</span>
        </div>
      ))}
      <div className="stack gap-4 pl-creep">
        <div className="label-caps text-muted">CR revenue vs scope-creep loss</div>
        <div className="pl-line"><span>Approved CR revenue</span><span className="num-cell text-green">{pl.crRevTotal}</span></div>
        <div className="pl-line"><span>Unbilled effort on unapproved CRs</span><span className="num-cell text-danger">− {pl.creepTotal}</span></div>
        <div className="pl-line fw-700"><span>Net</span><span className={`num-cell text-${pl.creepNetColor}`}>{pl.creepNet}</span></div>
      </div>
    </ChartCard>
  );
}

/** Outstanding invoices bucketed by age. */
export function ReceivablesAgeing({ ageing, hasAgeing }) {
  return (
    <ChartCard title="Receivables ageing">
      <StackedBar segments={ageing.buckets.map((b) => ({ key: b.key, pct: b.pct, tone: b.tone }))} height={16} />
      <div className="pl-buckets">
        {ageing.buckets.map((b) => (
          <div key={b.key} className="fs-10 text-muted">
            {b.label}
            <div className="num-cell text-ink">{b.value}</div>
          </div>
        ))}
      </div>
      {hasAgeing && (
        <div className="stack gap-4 pl-creep">
          {ageing.rows.map((r) => (
            <div key={r.key} className="pl-line">
              <span><strong>{r.client}</strong> · {r.label}</span>
              <span className={`num-cell text-${r.color}`}>{r.amount} · {r.age}</span>
            </div>
          ))}
        </div>
      )}
      <div className="meta">Outstanding · {ageing.total}</div>
    </ChartCard>
  );
}
