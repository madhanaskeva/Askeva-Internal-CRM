import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import StatCard from "../../components/common/StatCard";
import { useDispatch } from "react-redux";
import { taskOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { personDetail, resolvePerson, resolveRange, teamPeople } from "../../utils/domain/team";
import { PERSON_RANGES } from "../../data";
import { useData } from "../../app/useCrm";

const Section = ({ title, children }) => (
  <Card className="stack gap-8 team-card">
    <div className="section-title__text">{title}</div>
    {children}
  </Card>
);

/** Per-person record: tasks, tests, bugs and full history (person + range live in the URL). */
export default function Team() {
  const dispatch = useDispatch();
  const data = useData();
  const [params, setParams] = useSearchParams();
  const people = useMemo(() => teamPeople(data), [data]);
  const name = resolvePerson(people, params.get("person"));
  const range = resolveRange(params.get("range"));
  const person = useMemo(() => personDetail(data, people, name, range), [data, people, name, range]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  };
  const open = (taskId) => dispatch(taskOpened(taskId));

  if (!person) return <div className="page"><EmptyState>No active team members.</EmptyState></div>;

  return (
    <div className="page">
      <div className="row row--wrap gap-8">
        {people.map((p) => (
          <button key={p.name} type="button" className={cx("chip team-chip", p.name === name ? "tone-ink" : "tone-white")} onClick={() => setParam("person", p.name)}>
            <span>{p.name}</span>
            <span className="team-chip__role">{p.role}</span>
          </button>
        ))}
        <ChipGroup className="ml-auto" options={PERSON_RANGES} value={range} activeTone="lime" onChange={(v) => setParam("range", v)} />
      </div>

      <Card tone="ink800" className="row row--between row--baseline row--wrap gap-12">
        <div className="row row--baseline row--wrap gap-12">
          <span className="font-display team-name">{person.name}</span>
          <span className="fs-12 text-lime">{person.role}</span>
        </div>
        <span className="font-mono fs-11">{person.rangeLabel}</span>
      </Card>

      <div className="grid-auto count-grid">
        {person.metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} tone={m.tone} size="md" />
        ))}
      </div>

      {person.byProject.length > 0 && (
        <Section title="By project">
          {person.byProject.map((p) => (
            <div key={p.id} className="team-line">
              <span><strong>{p.client}</strong> <span className="mono-meta">{p.code}</span></span>
              <span className="text-body">{p.summary}</span>
            </div>
          ))}
        </Section>
      )}

      <div className="grid-auto min-300 team-grid">
        {person.isTester && (
          <Section title="Tasks tested">
            {person.tested.map((t) => (
              <button key={t.key} type="button" className="team-item" onClick={() => open(t.taskId)}>
                <div className="row row--between gap-8">
                  <span className="mono-meta">{t.date} · {t.project}</span>
                  <Pill size="xs" tone={t.tone}>{t.result}</Pill>
                </div>
                <div className="fs-12-5 fw-600 text-ink">{t.task}</div>
                <div className="fs-11 text-body">{t.note}</div>
              </button>
            ))}
            <div className="meta">Every pass/fail is a system-stamped history event — nothing here is self-reported.</div>
          </Section>
        )}

        {person.openTasks.length > 0 && (
          <Section title="Open tasks on their name">
            {person.openTasks.map((t) => (
              <button key={t.id} type="button" className="team-item" onClick={() => open(t.id)}>
                <div className="row row--between row--wrap gap-8">
                  <span className="mono-meta">{t.project} · due {t.due}</span>
                  <Pill size="xs" tone={t.statusTone}>{t.status}</Pill>
                </div>
                <div className="fs-12-5 fw-600 text-ink">{t.title}</div>
              </button>
            ))}
          </Section>
        )}

        <Section title="Bugs · lifecycle">
          {person.bugs.map((b) => (
            <button key={b.id} type="button" className="team-item" onClick={() => open(b.taskId)}>
              <div className="row row--between row--wrap gap-8">
                <span className="font-mono fs-10 fw-700 text-ink">{b.id} · {b.severity} · {b.project}</span>
                <Pill size="xs" tone={b.statusTone}>{b.status}</Pill>
              </div>
              <div className="fs-12 text-ink">{b.desc}</div>
              <div className="row row--wrap gap-4">
                {b.steps.map((s) => (
                  <Pill key={s.label} size="xs" tone={s.done ? "ink" : "white"} className={s.done ? "" : "text-muted"}>
                    {s.label} {s.date}
                  </Pill>
                ))}
              </div>
              <div className="fs-10 text-muted">Developer · {b.developer}</div>
            </button>
          ))}
        </Section>
      </div>

      <Card flush>
        <div className="card-head">
          <span className="section-title__text">Full history · chronological</span>
          <span className="meta">Newest first · click a row to open the task</span>
        </div>
        {person.log.map((l) => (
          <button key={l.key} type="button" className="team-log" onClick={() => open(l.taskId)}>
            <span className="mono-meta">{l.date}</span>
            <span className={`fs-11 fw-700 text-${l.color}`}>{l.text}</span>
            <span className="fs-11 text-ink">
              {l.ref} <span className="text-muted">{l.note}</span>
            </span>
          </button>
        ))}
      </Card>
    </div>
  );
}
