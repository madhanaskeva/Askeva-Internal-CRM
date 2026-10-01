import StackedBar from "../../../components/charts/StackedBar";
import Card from "../../../components/common/Card";
import Pill from "../../../components/common/Pill";
import PillButton from "../../../components/common/PillButton";
import StatCard from "../../../components/common/StatCard";
import DataTable from "../../../components/tables/DataTable";
import { useDispatch } from "react-redux";
import { taskOpened } from "../../../redux/slices/uiSlice";
import { cx, wPct } from "../../../utils/helpers/classNames";

const num = (title, key, cls) => ({ title, key, align: "right", render: (_, r) => <span className={cx("num-cell", cls)}>{r[key]}</span> });

const TableCard = ({ title, meta, children }) => (
  <Card flush>
    <div className="card-head">
      <span className="section-title__text">{title}</span>
      {meta && <span className="meta">{meta}</span>}
    </div>
    {children}
  </Card>
);

/**
 * All QA analytics panels (tester dashboard + Team QA): KPIs, project-wise
 * activity with drill-down, bug activity, severity, by-developer, efficiency,
 * retests, pending, test-next and the chronological timeline.
 * `qa` is buildQaAnalytics(...); `onFocus(projectId|null)` drives the drill-down.
 */
export default function QaAnalytics({ qa, onFocus }) {
  const dispatch = useDispatch();
  const open = (taskId) => dispatch(taskOpened(taskId));

  const projectCols = [
    {
      title: "Project",
      key: "project",
      render: (_, p) => (
        <button type="button" className="link-block text-ink" onClick={() => onFocus(p.id)}>
          <strong>{p.client}</strong> <span className="mono-meta">{p.code}</span>
        </button>
      ),
    },
    num("Tested", "tested"),
    num("Passed", "passed", "text-green"),
    num("Failed", "failed", "text-danger"),
    num("Bugs raised", "raised"),
    num("Retested", "retested"),
    num("Verified", "verified"),
    num("Reopened", "reopened"),
    num("Pending QA", "pendingQa"),
    {
      title: "Share",
      key: "share",
      render: (_, p) => (
        <div className="row gap-6 qa-share">
          <div className="qa-share__track"><div className={cx("qa-share__fill", wPct(p.share))} /></div>
          <span className="font-mono fs-10">{p.share}%</span>
        </div>
      ),
    },
  ];

  const focusCols = [
    {
      title: "Task",
      key: "task",
      render: (_, t) => (
        <button type="button" className="link-block text-ink" onClick={() => open(t.id)}>
          <span className="mono-meta">{t.id}</span> <strong>{t.title}</strong>
        </button>
      ),
    },
    { title: "Developer", dataIndex: "developer", key: "dev" },
    { title: "Received", key: "rec", render: (_, t) => <span className="font-mono fs-10">{t.received}</span> },
    { title: "Testing started", key: "st", render: (_, t) => <span className="font-mono fs-10">{t.started}</span> },
    { title: "Result", key: "res", render: (_, t) => <Pill size="xs" tone={t.resultTone}>{t.result}</Pill> },
    num("Bugs", "bugs"),
  ];

  const severityCols = [
    { title: "Severity", key: "sev", render: (_, s) => <Pill size="xs" tone={s.tone}>{s.sev}</Pill> },
    num("Raised", "raised"),
    num("Fixed", "fixed"),
    num("Retested", "retested"),
    num("Verified", "verified"),
    num("Open", "open", "text-danger fw-700"),
  ];

  const devCols = [
    { title: "Developer", key: "dev", render: (_, d) => <strong>{d.dev}</strong> },
    num("Tested", "tested"),
    num("Bugs", "raised", "fw-700"),
    num("Crit", "critical"),
    num("High", "high"),
    num("Med", "medium"),
    num("Low", "low"),
    num("Reopened", "reopened"),
  ];

  const retestCols = [
    {
      title: "Bug",
      key: "id",
      render: (_, r) => (
        <button type="button" className="link-block font-mono fs-11 fw-700 text-ink" onClick={() => open(r.taskId)}>{r.id}</button>
      ),
    },
    { title: "Project", dataIndex: "project", key: "project" },
    { title: "Developer", dataIndex: "developer", key: "dev" },
    { title: "Severity", dataIndex: "severity", key: "sev" },
    { title: "Fixed at", key: "fx", render: (_, r) => <span className="font-mono fs-10">{r.fixedAt}</span> },
    { title: "Retested at", key: "rt", render: (_, r) => <span className="font-mono fs-10">{r.retestAt}</span> },
    { title: "Result", key: "res", render: (_, r) => <Pill size="xs" tone={r.tone}>{r.result}</Pill> },
  ];

  return (
    <>
      <div className="grid-auto min-130 count-grid">
        {qa.kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} tone={k.tone} size="md" />
        ))}
      </div>

      <TableCard title="Project-wise activity" meta="Click a project to drill down">
        {qa.byProject.length > 0 && <DataTable columns={projectCols} dataSource={qa.byProject} flat className="card-table" />}
      </TableCard>

      {qa.focus && (
        <Card flush tone="lime">
          <div className="card-head row--between">
            <div>
              <div className="section-title__text">{qa.focus.client}</div>
              <div className="fs-11">
                {qa.focus.tested} tested · {qa.focus.passed} passed · {qa.focus.failed} failed · {qa.focus.raised} bugs raised · {qa.focus.retested} retested · {qa.focus.verified} verified · {qa.focus.reopened} reopened · {qa.focus.pendingQa} pending QA
              </div>
            </div>
            <PillButton size="xs" onClick={() => onFocus(null)}>Close</PillButton>
          </div>
          <DataTable columns={focusCols} dataSource={qa.focus.tasks} flat className="card-table" />
          <div className="card-foot text-ink">Click a task to open its full testing history (every event with actor and time).</div>
        </Card>
      )}

      <div className="grid-auto min-300 qa-grid">
        <Card className="stack gap-8 qa-card">
          <div className="section-title__text">My bug activity</div>
          {qa.bugActivity.map((b) => (
            <div key={b.label} className="qa-line">
              <span className="ellipsis flex-1">{b.label}</span>
              <strong className="font-mono">{b.n}</strong>
            </div>
          ))}
          <div className="label-caps text-muted mt-4">Currently pending · my bugs by status</div>
          <StackedBar segments={qa.statusBreak.map((s) => ({ key: s.label, pct: s.pct, tone: s.tone }))} height={14} />
          <div className="row row--wrap gap-8">
            {qa.statusBreak.map((s) => (
              <span key={s.label} className="row gap-4 fs-10 nowrap">
                <span className={`legend-dot legend-dot--sm tone-${s.tone}`} />
                {s.label} {s.n}
              </span>
            ))}
          </div>
        </Card>

        <TableCard title="Bug severity">
          <DataTable columns={severityCols} dataSource={qa.severity} rowKey="sev" flat className="card-table" />
        </TableCard>

        <Card flush>
          <div className="card-head qa-head-stack">
            <span className="section-title__text">Bugs found by developer</span>
            <span className="fs-10 text-muted">Operational quality signal, not a performance score — harder modules produce more bugs.</span>
          </div>
          {qa.byDev.length > 0 && <DataTable columns={devCols} dataSource={qa.byDev} rowKey="dev" flat className="card-table" />}
        </Card>
      </div>

      <div className="grid-auto min-160 count-grid">
        {qa.efficiency.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} size="md" />
        ))}
      </div>

      <div className="grid-auto min-300 qa-grid">
        <TableCard title="Retest activity">
          {qa.retests.length > 0 && <DataTable columns={retestCols} dataSource={qa.retests} flat className="card-table" />}
        </TableCard>
        <div className="stack gap-16">
          <Card tone="ink800" className="stack gap-6 qa-card">
            <div className="section-title__text text-lime">Pending QA</div>
            {qa.pending.map((p) => (
              <div key={p.label} className="qa-line qa-line--dark">
                <span className="ellipsis flex-1">{p.label}</span>
                <strong className="font-mono fs-13">{p.n}</strong>
              </div>
            ))}
          </Card>
          <Card tone="lime" className="stack gap-6 qa-card">
            <div className="section-title__text">Test next · high priority first</div>
            {qa.next.map((n) => (
              <button key={n.key} type="button" className="qa-next" onClick={() => open(n.taskId)}>
                <span className="mono-meta">{n.n}</span>
                <Pill size="xs" tone={n.sevTone}>{n.sev}</Pill>
                <Pill size="xs" tone="paper">{n.kind}</Pill>
                <span className="flex-1 text-ink">
                  <strong className="font-mono fs-10">{n.id}</strong> {n.label}
                </span>
                <span className="fs-10 text-muted nowrap">{n.project}</span>
              </button>
            ))}
          </Card>
        </div>
      </div>

      <TableCard title="Complete activity · chronological" meta="System-generated · click to open">
        {qa.timeline.map((l) => (
          <button key={l.key} type="button" className="qa-timeline" onClick={() => open(l.taskId)}>
            <span className="mono-meta">{l.when}</span>
            <span className={`fs-11 fw-700 text-${l.color}`}>{l.text}</span>
            <span className="fs-11 text-ink">
              {l.ref} <span className="text-muted">{l.note}</span>
            </span>
            <span className="fs-10 text-muted qa-timeline__project">{l.project}</span>
          </button>
        ))}
      </TableCard>
    </>
  );
}
