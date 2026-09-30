import { useMemo } from "react";
import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import SectionTitle from "../../components/common/SectionTitle";
import { COMPLETED_STAGE, GATES, STAGES } from "../../constants/crm";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../constants/routes";
import { useSelector } from "react-redux";
import { selectData, selectHealthMap } from "../../redux/selectors";
import { TODAY, daysBetween, fmt } from "../../utils/date";
import { isDone } from "../../utils/domain/tasks";
import { healthTone, stageTone } from "../../utils/domain/tones";

/** Pipeline card view-model — port of the original `projectCards`. */
function useProjectCards() {
  const data = useSelector(selectData);
  const H = useSelector(selectHealthMap);
  return useMemo(() => {
    const dueFu = data.followups.filter((f) => f.status === "pending" && daysBetween(f.due, TODAY) <= 0);
    const cards = data.projects.map((p) => {
      const h = H[p.id];
      const items = GATES[p.stage].items;
      const done = items.filter(([k]) => p.gates[p.stage] && p.gates[p.stage][k]).length;
      const openCrs = data.crs.filter((c) => c.projectId === p.id && c.status !== "Approved").length;
      return {
        id: p.id,
        code: p.code,
        client: p.client,
        billing: p.billing + " billing",
        spoc: p.spoc,
        isCompleted: p.stage >= COMPLETED_STAGE,
        onHold: !!p.onHold,
        holdReason: p.holdReason || "",
        cardTone: p.onHold ? "rose" : p.stage >= 7 ? "cream" : "white",
        stageLabel: `${p.stage} · ${STAGES[p.stage]}`,
        stageTone: stageTone(p.stage),
        pct: Math.round((p.stage / 7) * 100),
        health: h.status,
        healthTone: healthTone(h.status),
        deadlineLabel: `Deadline ${fmt(h.eff)} · ${h.left < 0 ? -h.left + "d over" : h.left + "d left"}`,
        openTasks: data.tasks.filter((t) => t.projectId === p.id && !isDone(t)).length,
        dueFollowups: dueFu.filter((f) => f.projectId === p.id).length,
        openCrs,
        nextGate: items.length ? `${done}/${items.length} gate items → ${STAGES[Math.min(p.stage + 1, 7)]}` : "archived",
      };
    });
    const active = cards.filter((c) => !c.isCompleted).sort((a, b) => (a.onHold ? 1 : 0) - (b.onHold ? 1 : 0));
    const completed = cards.filter((c) => c.isCompleted);
    return {
      active,
      completed,
      activeCount: `${active.filter((c) => !c.onHold).length} ongoing · ${active.filter((c) => c.onHold).length} on hold`,
      completedCount: completed.length + " completed",
    };
  }, [data, H]);
}

function ProjectCard({ p }) {
  const navigate = useNavigate();
  return (
    <Card tone={p.cardTone} onClick={() => navigate(pathFor("detail", { projectId: p.id }))} className="stack gap-10">
      <div className="row row--between row--top gap-8">
        <div>
          <div className="mono-meta">{p.code} · {p.billing}</div>
          <div className="font-display text-ink proj-card__client">{p.client}</div>
        </div>
        <div className="stack gap-4 proj-card__badges">
          <Pill tone={p.stageTone}>{p.stageLabel}</Pill>
          {p.onHold && <Pill size="xs" tone="danger">ON HOLD</Pill>}
        </div>
      </div>
      <ProgressBar pct={p.pct} fill="gradient" />
      <div className="grid-3 meta">
        <div>
          <div className="stat-value stat-value--sm text-ink">{p.openTasks}</div>open tasks
        </div>
        <div>
          <div className="stat-value stat-value--sm text-ink">{p.dueFollowups}</div>follow-ups due
        </div>
        <div>
          <div className={`stat-value stat-value--sm ${p.openCrs ? "text-danger" : "text-ink"}`}>{p.openCrs}</div>open CRs
        </div>
      </div>
      <div className="row row--between gap-8 proj-card__line">
        <span>{p.deadlineLabel}</span>
        <Pill size="xs" tone={p.healthTone}>{p.health}</Pill>
      </div>
      {p.onHold && <div className="fs-11 fw-600 text-danger">Hold · {p.holdReason}</div>}
      <div className="proj-card__line">
        SPOC · <strong className="text-ink">{p.spoc}</strong> · Next: {p.nextGate}
      </div>
    </Card>
  );
}

/** Projects pipeline — ongoing & on hold first, then completed. */
export default function Projects() {
  const { active, completed, activeCount, completedCount } = useProjectCards();
  return (
    <div className="page">
      <SectionTitle title="Ongoing & on hold" meta={activeCount} />
      {active.length === 0 && <EmptyState>No active projects.</EmptyState>}
      <div className="grid-fill min-280">
        {active.map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
      </div>
      {completed.length > 0 && (
        <>
          <div className="divider-top" />
          <SectionTitle title="Completed" meta={completedCount} />
          <div className="grid-fill min-280">
            {completed.map((p) => (
              <ProjectCard key={p.id} p={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
