import { useMemo } from "react";
import CountCard from "../../components/cards/CountCard";
import InboxCard from "../../components/cards/InboxCard";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import SectionLabel from "../../components/common/SectionLabel";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { taskOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/cx";
import { buildDevWork } from "../../utils/domain/devWork";
import { useData, useHealthMap } from "../../app/useCrm";

/** Clickable work item inside a My-work column. */
function WorkItem({ taskId, tone = "white", head, badge, title, sub, subClass = "text-muted" }) {
  const dispatch = useDispatch();
  return (
    <button type="button" className={cx("mw-item", `tone-${tone}`)} onClick={() => dispatch(taskOpened(taskId))}>
      {(head || badge) && (
        <div className="row row--between gap-8 w-full">
          {head}
          {badge}
        </div>
      )}
      <div className="fw-600 text-ink fs-12-5">{title}</div>
      {sub && <div className={`fs-11 ${subClass}`}>{sub}</div>}
    </button>
  );
}

/** Developer home: inbox strip, today's work, rework & bugs, waiting for test, blocked, references. */
export default function MyWork() {
  const data = useData();
  const role = useSelector(selectRole);
  const H = useHealthMap();
  const mw = useMemo(() => buildDevWork(data, role, H), [data, role, H]);

  return (
    <div className="page">
      <div className="grid-auto min-130 count-grid">
        <CountCard label="Today" value={mw.counts.today} tone="lime" />
        <CountCard label="Rework" value={mw.counts.rework} tone="rose" valueColor="danger" />
        <CountCard label="Awaiting test" value={mw.counts.waiting} labelColor="muted" />
        <CountCard label="Open bugs" value={mw.counts.bugs} tone="ink800" labelColor="lime" />
        <CountCard label="Blocked" value={mw.counts.blocked} labelColor="muted" />
      </div>

      {mw.inbox.length > 0 && (
        <Card tone="lime" className="stack gap-10 mw-col">
          <div className="row row--between row--wrap gap-8">
            <span className="section-title__text">Inbox · new allocations to accept</span>
            <span className="fs-11">Accept or decline the same day</span>
          </div>
          {mw.inbox.map((t) => (
            <InboxCard key={t.id} t={t} />
          ))}
        </Card>
      )}

      <div className="grid-auto min-280 mw-grid">
        <Card className="stack gap-8 mw-col">
          <div className="section-title__text">Today&apos;s work</div>
          {mw.today.map((t) => (
            <WorkItem
              key={t.id}
              taskId={t.id}
              tone={t.rowTone}
              head={<span className="mono-meta">{t.project} · {t.stage}</span>}
              badge={<Pill size="xs" tone={t.statusTone}>{t.status}</Pill>}
              title={t.title}
              sub={`due ${t.due} ${t.overdueTag} · ${t.priority}`}
              subClass={`text-${t.dueColor}`}
            />
          ))}
        </Card>

        <Card tone="rose" className="stack gap-8 mw-col">
          <div className="section-title__text">Rework &amp; bugs assigned to me</div>
          {mw.rework.map((t) => (
            <WorkItem
              key={t.id}
              taskId={t.id}
              head={<span className="mono-meta">{t.project}</span>}
              badge={<Pill size="xs" tone={t.statusTone}>{t.status}</Pill>}
              title={t.title}
              sub={`${t.openBugs} open bug(s)`}
            />
          ))}
          {mw.bugs.map((b) => (
            <WorkItem
              key={b.id}
              taskId={b.taskId}
              head={<span className="font-mono fs-10 fw-700 text-ink">{b.id} · {b.severity}</span>}
              badge={<span className="fs-10 fw-700 text-danger">{b.age}</span>}
              title={b.desc}
              sub={`${b.project} · ${b.task}`}
            />
          ))}
        </Card>

        <Card tone="paper" className="stack gap-8 mw-col">
          <div className="section-title__text">Waiting for testing</div>
          {mw.waiting.map((t) => (
            <WorkItem
              key={t.id}
              taskId={t.id}
              head={<span className="mono-meta">{t.project}</span>}
              badge={<Pill size="xs" tone={t.statusTone}>{t.status}</Pill>}
              title={t.title}
              sub={`completed ${t.completedOn}`}
            />
          ))}
          <div className="section-title__text mt-4">Blocked</div>
          {mw.blocked.map((t) => (
            <WorkItem key={t.id} taskId={t.id} title={t.title} sub={`BLOCKED · ${t.project}`} subClass="text-danger" />
          ))}
        </Card>
      </div>

      <Card className="mw-refs">
        <SectionLabel className="mb-8">Requirements &amp; references for my active projects</SectionLabel>
        {mw.refs.map((r) => (
          <div key={r.id} className="mw-ref">
            <strong className="text-ink">{r.client}</strong>
            <span>{r.ref}</span>
            <span className="mono-meta">{r.stage} · deadline {r.due}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
