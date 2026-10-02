import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FollowupItem from "../../components/cards/FollowupItem";
import StackedBar from "../../components/charts/StackedBar";
import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import SectionLabel from "../../components/common/SectionLabel";
import StatCard from "../../components/common/StatCard";
import GridTable from "../../components/tables/GridTable";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { pathFor } from "../../utils/helpers/routes";
import { taskOpened } from "../../redux/slices/uiSlice";
import { useDashboard } from "./useDashboard";
import { DASHBOARD_SORTS } from "../../data";

const PAGE_SIZE = 5;

function ArrowPagination({ currentPage, totalPages, totalItems, pageSize = PAGE_SIZE, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="row gap-6 items-center nav-pagination">
      <span className="font-mono fs-10 text-muted nowrap">
        {start}–{end} of {totalItems}
      </span>
      <div className="row gap-4 items-center">
        <button
          type="button"
          className="fu-arrow-btn"
          disabled={currentPage === 0}
          onClick={onPrev}
          title="Previous (Reverse)"
        >
          <ChevronLeft size={12} strokeWidth={2.5} />
        </button>
        <span className="font-mono fs-10 text-muted">
          {currentPage + 1}/{totalPages}
        </span>
        <button
          type="button"
          className="fu-arrow-btn"
          disabled={currentPage >= totalPages - 1}
          onClick={onNext}
          title="Next (Forward)"
        >
          <ChevronRight size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [sort, setSort] = useState("risk");
  const [analyticsPage, setAnalyticsPage] = useState(0);
  const [followupPage, setFollowupPage] = useState(0);
  const [stagePage, setStagePage] = useState(0);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  /** Alert target: navigate to its view and/or open its task in the drawer. */
  const openTarget = (target) => {
    if (!target) return;
    if (target.taskId) {
      dispatch(taskOpened(target.taskId));
      return;
    }
    if (target.view) navigate(pathFor(target.view, target) + (target.search || ""));
  };

  const { stats, analytics: a, escalations, dashRows, todayFollowups, projectRows } = useDashboard(sort);

  const handleSortChange = (s) => {
    setSort(s);
    setAnalyticsPage(0);
  };

  // Analytics Table pagination (5 per page)
  const analyticsTotalPages = Math.max(1, Math.ceil(dashRows.length / PAGE_SIZE));
  const safeAnalyticsPage = Math.min(analyticsPage, analyticsTotalPages - 1);
  const visibleDashRows = dashRows.slice(safeAnalyticsPage * PAGE_SIZE, (safeAnalyticsPage + 1) * PAGE_SIZE);

  // Today's Follow-ups pagination (5 per page)
  const followupTotalPages = Math.max(1, Math.ceil(todayFollowups.length / PAGE_SIZE));
  const safeFollowupPage = Math.min(followupPage, followupTotalPages - 1);
  const visibleTodayFollowups = todayFollowups.slice(safeFollowupPage * PAGE_SIZE, (safeFollowupPage + 1) * PAGE_SIZE);

  // Projects by Stage pagination (5 per page)
  const stageTotalPages = Math.max(1, Math.ceil(projectRows.length / PAGE_SIZE));
  const safeStagePage = Math.min(stagePage, stageTotalPages - 1);
  const visibleProjectRows = projectRows.slice(safeStagePage * PAGE_SIZE, (safeStagePage + 1) * PAGE_SIZE);

  return (
    <div className="page">
      <div className="grid-auto min-170 grid-gap-14">
        {stats.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value}
            sub={s.sub}
            tone={s.tone}
            onClick={s.view ? () => navigate(pathFor(s.view)) : undefined}
          />
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
        <Card className="stack gap-8">
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

        <Card className="stack gap-8">
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

        <Card className="stack gap-8">
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

        <Card tone="ink800" className="stack gap-8">
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

      <div className="row row--between row--wrap gap-8 items-center">
        <ChipGroup label="Sort projects by" options={DASHBOARD_SORTS} value={sort} onChange={handleSortChange} />
        <ArrowPagination
          currentPage={safeAnalyticsPage}
          totalPages={analyticsTotalPages}
          totalItems={dashRows.length}
          pageSize={PAGE_SIZE}
          onPrev={() => setAnalyticsPage((p) => Math.max(0, p - 1))}
          onNext={() => setAnalyticsPage((p) => Math.min(analyticsTotalPages - 1, p + 1))}
        />
      </div>

      <GridTable
        className="dash-table"
        headers={["Project analytics", "Deadline", "Schedule", "Effort budget", "Revenue", "Forecast P&L", "Health"]}
        rows={visibleDashRows}
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
          <div className="row row--between items-center">
            <SectionLabel>Today&apos;s follow-ups</SectionLabel>
            <ArrowPagination
              currentPage={safeFollowupPage}
              totalPages={followupTotalPages}
              totalItems={todayFollowups.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setFollowupPage((p) => Math.max(0, p - 1))}
              onNext={() => setFollowupPage((p) => Math.min(followupTotalPages - 1, p + 1))}
            />
          </div>
          {todayFollowups.length === 0 && <EmptyState>Nothing due today. Daily client call and MoM are still mandatory.</EmptyState>}
          <div className="stack gap-8">
            {visibleTodayFollowups.map((f) => (
              <FollowupItem key={f.id} followup={f} variant="minimal" />
            ))}
          </div>
        </Card>

        <Card className="stack gap-12">
          <div className="row row--between items-center">
            <SectionLabel>Projects by stage</SectionLabel>
            <ArrowPagination
              currentPage={safeStagePage}
              totalPages={stageTotalPages}
              totalItems={projectRows.length}
              pageSize={PAGE_SIZE}
              onPrev={() => setStagePage((p) => Math.max(0, p - 1))}
              onNext={() => setStagePage((p) => Math.min(stageTotalPages - 1, p + 1))}
            />
          </div>
          <div className="stack gap-8">
            {visibleProjectRows.map((p) => (
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
