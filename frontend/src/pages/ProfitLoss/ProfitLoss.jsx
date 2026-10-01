import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/tables/DataTable";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { cx } from "../../utils/helpers/cx";
import { computeProfitLoss } from "../../utils/domain/profitLoss";
import { lPct, wPct } from "../../utils/helpers/pct";
import { CostBreakdown, MarginTrend, ReceivablesAgeing, RevenueBars } from "./ProfitLossCharts";
import { PL_PERIODS } from "../../data";
import { useData, useFinMap, usePortfolio } from "../../app/useCrm";

const num = (key, colorKey, bold) => ({
  title: "",
  key,
  align: "right",
  render: (_, r) => <span className={cx("num-cell", bold && "fw-700", colorKey && `text-${r[colorKey]}`)}>{r[key]}</span>,
});
const titled = (title, col) => ({ ...col, title });

/** Profit & loss (Admin / Super admin): period P&L, forecast at completion, trends, ageing, LTV, people. */
export default function ProfitLoss() {
  const navigate = useNavigate();
  const data = useData();
  const FIN = useFinMap();
  const port = usePortfolio();
  const [period, setPeriod] = useState("month");
  const pl = useMemo(() => computeProfitLoss(data, FIN, port, period), [data, FIN, port, period]);

  const projectCols = [
    {
      title: "Project",
      key: "project",
      render: (_, r) => (
        <button type="button" className="link-block text-ink" onClick={() => navigate(pathFor("detail", { projectId: r.id }))}>
          <strong>{r.client}</strong>
          <div className="mono-meta">{r.code} · {r.billing} · {r.stage}</div>
        </button>
      ),
    },
    titled("Recognised", num("recognised")),
    titled("Staff cost", num("staff")),
    titled("Expenses", num("exp")),
    titled("Period P&L", num("pl", "plColor", true)),
    titled("Planned P&L", num("plannedPL")),
    titled("Forecast P&L", num("forecastPL", "forecastColor")),
    titled("Variance", num("variance", "varianceColor")),
    titled("Margin", num("margin", "marginColor", true)),
    {
      title: "Burn vs progress",
      key: "burn",
      render: (_, r) => (
        <div className="pl-burn">
          <div className="row row--between fs-10 text-muted">
            <span>effort {r.effortPct}%</span>
            <span>stage {r.progress}%</span>
          </div>
          <div className="pl-burn__track">
            <div className={cx("pl-burn__fill", `bar__fill--${r.burnKey}`, wPct(r.effortPct))} />
            <div className={cx("pl-burn__marker", lPct(r.progress))} />
          </div>
          <div className={`fs-10 pl-burn__note--${r.burnKey}`}>{r.burnNote}</div>
        </div>
      ),
    },
  ];

  const clientCols = [
    { title: "Client", key: "client", render: (_, c) => <strong>{c.client}</strong> },
    titled("Projects", num("projects")),
    titled("Revenue", num("revenueL")),
    titled("CRs", num("crRevL")),
    titled("Received", num("receivedL")),
    titled("Forecast P&L", num("plL", "plColor", true)),
    titled("Margin", num("margin")),
  ];

  const peopleCols = [
    { title: "Person", key: "name", render: (_, p) => (<><strong>{p.name}</strong><div className="fs-10 text-muted">{p.role} · {p.note}</div></>) },
    titled("Days", num("days")),
    titled("Cost", num("cost")),
    titled("Output", num("output")),
    titled("Ratio", num("ratio", "ratioColor", true)),
  ];

  return (
    <div className="page">
      <div className="row row--between row--wrap gap-12">
        <span className="font-mono fs-11 text-ink">{pl.periodLabel}</span>
        <ChipGroup options={PL_PERIODS} value={period} onChange={setPeriod} />
      </div>

      <div className="grid-auto min-170 count-grid">
        {pl.stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} size="md" />
        ))}
      </div>

      <Card flush>
        <div className="card-head">
          <span className="section-title__text">Per-project P&amp;L</span>
          <span className="meta">Period columns follow the selector · forecast columns are at completion</span>
        </div>
        <DataTable columns={projectCols} dataSource={pl.rows} flat className="card-table" />
      </Card>

      <div className="grid-auto min-320 pl-grid">
        <RevenueBars bars={pl.bars} />
        <MarginTrend trend={pl.trend} />
        <CostBreakdown pl={pl} />
        <ReceivablesAgeing ageing={pl.ageing} hasAgeing={pl.hasAgeing} />
      </div>

      <div className="grid-auto min-320 pl-grid">
        <Card flush>
          <div className="card-head">
            <span className="section-title__text">Per-client lifetime value</span>
          </div>
          <DataTable columns={clientCols} dataSource={pl.clients} rowKey="client" flat className="card-table" />
        </Card>
        <Card flush>
          <div className="card-head">
            <span className="section-title__text">Per-person cost vs billable output</span>
            <span className="fs-10 text-muted">Output = share of project revenue earned by their logged days</span>
          </div>
          <DataTable columns={peopleCols} dataSource={pl.people} flat className="card-table" />
        </Card>
      </div>
    </div>
  );
}
