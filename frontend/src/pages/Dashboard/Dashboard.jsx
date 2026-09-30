import { useState } from "react";
import FollowupItem from "../../components/cards/FollowupItem";
import StackedBar from "../../components/charts/StackedBar";
import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import SectionLabel from "../../components/common/SectionLabel";
import StatCard from "../../components/common/StatCard";
import GridTable from "../../components/tables/GridTable";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { pathFor } from "../../constants/routes";
import { taskOpened } from "../../redux/slices/uiSlice";
import { useDashboard } from "./useDashboard";

const SORTS = [
  { value: "risk", label: "Risk" },
  { value: "pl", label: "Lowest P&L" },
  { value: "deadline", label: "Nearest deadline" },
  { value: "burn", label: "Highest burn" },
];

export default function Dashboard() {
  const [sort, setSort] = useState("risk");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  /** Alert target: navigate to its view and/or open its task in the drawer. */
  const openTarget = (target) => {
    if (target.view) navigate(pathFor(target.view, target) + (target.search || ""));
    if (target.taskId) dispatch(taskOpened(target.taskId));
  };
  const { stats, analytics: a, escalations, dashRows, todayFollowups, projectRows } = useDashboard(sort);

  return (
    <div className="page">
      <div className="grid-auto min-170 grid-gap-14">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} onClick={() => navigate(pathFor(s.view))} />
        ))}
      </div>

      {escalations.length > 0 && (
        <Card tone="ink800">
          <div className="label-caps text-lime mb-10">Escalation watch · SOP §12</div>
          <div className="stack gap-8">
            {escalations.map((e) => (
              <button key={e.level} type="button" className="alert-row" onClick={() => openTarget(e.target)}>
                <Pill tone={e.tone} bold className="pill--borderless">{e.level}</Pill>
                <span className="flex-1">{e.text}</span>
                <span className="mono-meta text-meta">{e.project}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid-auto min-230">
        <Card onClick={() => navigate(pathFor("deadlines"))} className="stack gap-8">
          <SectionLabel>Deadline health</SectionLabel>
          <StackedBar segments={a.deadline.map((s) => ({ key: s.label, pct: s.pct, tone: s.tone }))} />
          <div className="row row--wrap gap-12">
            {a.deadline.map((s) => (
              <div key={s.label} className="row gap-6 fs-12 text-ink">
                <span className={`legend-dot tone-${s.tone}`} />
                <strong>{s.value}</strong> {s.label}
              </div>
            ))}
          </div>
          <div className="meta">{a.overdueMs} milestones overdue across portfolio</div>
        </Card>

        <Card onClick={() => navigate(pathFor("deadlines"))} className="stack gap-8">
          <SectionLabel>Timeline</SectionLabel>
          <div className="grid-2">
            <div>
              <div className="stat-value stat-value--md text-ink">{a.avgVariance}%</div>
              <div className="meta">avg. behind schedule</div>
            </div>
            <div>
              <div className="stat-value stat-value--md text-ink">{a.totalSlip}d</div>
              <div className="meta">cumulative slip</div>
            </div>
            <div>
              <div className="stat-value stat-value--md text-green">+{a.totalExt}d</div>
              <div className="meta">approved CR extensions</div>
            </div>
          </div>
        </Card>

        <Card onClick={() => navigate(pathFor("finance"))} className="stack gap-8">
          <SectionLabel>Cost management</SectionLabel>
          <div className="row row--between meta">
            <span>Staff cost used</span>
            <span>{a.burn}% of plan</span>
          </div>
          <ProgressBar pct={a.burn} height={10} outlined />
          <div className="kv">
            <span>Staff actual</span>
            <strong className="text-ink">{a.actualStaff}</strong>
            <span>Staff planned</span>
            <span>{a.plannedStaff}</span>
            <span>Expenses</span>
            <span>{a.expenses}</span>
            <span>Forecast cost</span>
            <strong className="text-ink">{a.forecastCost}</strong>
          </div>
        </Card>

        <Card tone="ink800" onClick={() => navigate(pathFor("finance"))} className="stack gap-8">
          <SectionLabel onDark>P&amp;L</SectionLabel>
          <div className="font-display text-lime dashboard-pl">{a.forecastPL}</div>
          <div className="meta text-meta">forecast profit · {a.margin} margin</div>
          <div className="kv kv--dark">
            <span>Revenue</span>
            <strong>{a.revenue}</strong>
            <span>Received</span>
            <span>{a.received}</span>
            <span>Outstanding</span>
            <span>{a.due}</span>
            <span>Cash P&amp;L</span>
            <span>{a.cashPL}</span>
          </div>
        </Card>
      </div>

      <ChipGroup label="Sort projects by" options={SORTS} value={sort} onChange={setSort} />

      <GridTable
        className="dash-table"
        headers={["Project analytics", "Deadline", "Schedule", "Effort budget", "Revenue", "Forecast P&L", "Health"]}
        rows={dashRows}
        onRowClick={(r) => navigate(pathFor("detail", { projectId: r.id }))}
        renderCells={(r) => [
          <div key="p">
            <div className="fw-700 text-ink">{r.client}</div>
            <div className="fs-10 text-muted">{r.stage}</div>
          </div>,
          <div key="d" className={`fw-700 text-${r.leftColor}`}>{r.leftLabel}</div>,
          <div key="s" className={`text-${r.varianceColor}`}>{r.variance}</div>,
          <div key="e">
            <div className={`fw-600 text-${r.burnColor}`}>{r.daysLabel}</div>
            <ProgressBar pct={r.burn} height={5} fill={r.burnFill} className="mt-3" />
          </div>,
          <div key="r">
            <div className="fw-600 text-ink">{r.revenue}</div>
            <div className={`fs-10 text-${r.dueColor}`}>{r.due} due {r.overdueInvLabel}</div>
          </div>,
          <div key="pl">
            <div className={`fw-700 text-${r.plColor}`}>{r.forecastPL}</div>
            <div className={`fs-10 text-${r.marginColor}`}>{r.margin} margin</div>
          </div>,
          <Pill key="h" size="xs" tone={r.healthTone}>{r.health}</Pill>,
        ]}
      />

      <div className="grid-auto min-300">
        <Card className="stack gap-12">
          <SectionLabel>Today&apos;s follow-ups</SectionLabel>
          {todayFollowups.length === 0 && <EmptyState>Nothing due today. Daily client call and MoM are still mandatory.</EmptyState>}
          <div className="stack gap-8">
            {todayFollowups.map((f) => (
              <FollowupItem key={f.id} followup={f} variant="minimal" />
            ))}
          </div>
        </Card>

        <Card className="stack gap-12">
          <SectionLabel>Projects by stage</SectionLabel>
          <div className="stack gap-8">
            {projectRows.map((p) => (
              <button key={p.id} type="button" className="stage-row" onClick={() => navigate(pathFor("detail", { projectId: p.id }))}>
                <div className="fw-700 text-ink fs-13">
                  {p.client} <span className="mono-meta">{p.code}</span>
                </div>
                <Pill tone={p.stageTone}>{p.stageLabel}</Pill>
                <ProgressBar pct={p.pct} fill="gradient" className="stage-row__bar" />
                <span className="meta">{p.deadlineLabel}</span>
                <Pill size="xs" tone={p.healthTone} className="justify-self-end">{p.health}</Pill>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
