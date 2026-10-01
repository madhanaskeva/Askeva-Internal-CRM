import CountCard from "../../../components/cards/CountCard";
import Card from "../../../components/common/Card";
import Pill from "../../../components/common/Pill";
import PillButton from "../../../components/common/PillButton";
import StatCard from "../../../components/common/StatCard";
import GridTable from "../../../components/tables/GridTable";
import { useDispatch } from "react-redux";
import { taskOpened } from "../../../redux/slices/uiSlice";
import { moveBug } from "../../../utils/actions/taskActions";
import { useAction } from "../../../app/useCrm";

/** Tester "Queue · retest · decisions" tab. `q` is buildQaQueue(...). */
export default function QaQueue({ q }) {
  const dispatch = useDispatch();
  const run = useAction();
  const open = (taskId) => dispatch(taskOpened(taskId));

  return (
    <>
      <div className="grid-auto min-130 count-grid">
        <CountCard label="Test queue" value={q.counts.queue} tone="lime" />
        <CountCard label="In testing" value={q.counts.testing} labelColor="muted" />
        <CountCard label="Retest" value={q.counts.retest} labelColor="muted" />
        <CountCard label="Open bugs" value={q.counts.open} tone="danger" />
        <CountCard label="Blocked tasks" value={q.counts.blocked} labelColor="muted" />
      </div>

      <div className="grid-auto min-260 qa-grid">
        <Card tone="lime" className="stack gap-8 qa-card">
          <div className="section-title__text">Test queue · dev completed</div>
          {q.queue.map((t) => (
            <button key={t.id} type="button" className="qa-item tone-white" onClick={() => open(t.id)}>
              <div className="mono-meta">{t.project} · {t.priority} · by {t.assignee}</div>
              <div className="fw-600 text-ink fs-12-5">{t.title}</div>
              <div className="meta">dev completed {t.completedOn}</div>
            </button>
          ))}
          {q.testing.map((t) => (
            <button key={t.id} type="button" className="qa-item tone-paper" onClick={() => open(t.id)}>
              <div className="mono-meta">{t.project} · IN TESTING</div>
              <div className="fw-600 text-ink fs-12-5">{t.title}</div>
            </button>
          ))}
        </Card>

        <Card className="stack gap-8 qa-card">
          <div className="section-title__text">Retest · developer says fixed</div>
          {q.retest.map((b) => (
            <div key={b.id} className="qa-item stack gap-6">
              <div className="font-mono fs-10 fw-700 text-ink">{b.id} · {b.severity} · {b.project}</div>
              <div className="fw-600 text-ink fs-12-5">{b.desc}</div>
              <div className="meta">fixed {b.fixed} by {b.developer}</div>
              <div className="row gap-6">
                <PillButton size="xs" tone="lime" onClick={() => run(moveBug, b.id, "Retest")}>Start retest</PillButton>
                <PillButton size="xs" onClick={() => open(b.taskId)}>Open task</PillButton>
              </div>
            </div>
          ))}
          {q.rejected.map((b) => (
            <div key={b.id} className="qa-item tone-paper stack gap-6">
              <div className="font-mono fs-10 fw-700 text-ink">{b.id} · REJECTED BY DEVELOPER</div>
              <div className="fw-600 text-ink fs-12-5">{b.desc}</div>
              <div className="row gap-6">
                <PillButton size="xs" tone="ink" onClick={() => run(moveBug, b.id, "NotABug")}>Accept · not a bug</PillButton>
                <PillButton size="xs" tone="danger" onClick={() => run(moveBug, b.id, "Reopened")}>Reopen</PillButton>
              </div>
            </div>
          ))}
        </Card>

        <Card tone="ink800" className="stack gap-6 qa-card">
          <div className="label-caps text-lime">Daily bug report · {q.report.date}</div>
          <div className="qa-report">
            <span>Assigned bugs</span><strong>{q.report.assigned}</strong>
            <span>Bugs / tasks tested</span><strong>{q.report.tested}</strong>
            <span>Passed</span><strong>{q.report.passed}</strong>
            <span>Failed</span><strong>{q.report.failed}</strong>
            <span>Re-tested</span><strong>{q.report.retested}</strong>
            <span>New bugs identified</span><strong>{q.report.raised}</strong>
            <span>Pending retest</span><strong>{q.report.pending}</strong>
          </div>
        </Card>
      </div>

      <div className="grid-auto count-grid">
        {q.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} size="md" />
        ))}
        <Card className="count-card">
          <div className="label-caps text-muted">Rework per developer</div>
          {q.reworkByDev.map((r) => (
            <div key={r.dev} className="fs-12 text-ink"><strong>{r.dev}</strong> · {r.label}</div>
          ))}
        </Card>
      </div>

      <GridTable
        className="qa-bug-table"
        headers={["Bug", "Description · module · task", "Project", "Severity", "Dev · tester", "Raised · fixed · retest", "Age · result", "Status"]}
        rows={q.bugs}
        renderCells={(b) => [
          <button key="id" type="button" className="link-block font-mono fs-10 fw-700 text-ink" onClick={() => open(b.taskId)}>{b.id}</button>,
          <div key="d" className="flex-1">
            <div className="fw-600 text-ink">{b.desc}</div>
            <div className="fs-10 text-muted">{b.module} · {b.task}</div>
          </div>,
          <span key="p">{b.project}</span>,
          <Pill key="s" size="xs" tone={b.sevTone} className="justify-self-start">{b.severity}</Pill>,
          <span key="dt" className="fs-11">{b.developer} · {b.tester}</span>,
          <span key="dates" className="font-mono fs-10">{b.raised} · {b.fixed} · {b.retest}</span>,
          <div key="age">
            <div className={`fw-700 text-${b.ageColor}`}>{b.age}</div>
            <div className="fs-10 text-muted">{b.result}</div>
          </div>,
          <Pill key="st" size="xs" tone={b.statusTone}>{b.status}</Pill>,
        ]}
      />
    </>
  );
}
