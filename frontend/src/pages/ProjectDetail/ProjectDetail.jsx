import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { CrEmailToggle, CrNextButton } from "../../components/cards/CrActions";
import FollowupItem from "../../components/cards/FollowupItem";
import TaskRow from "../../components/cards/TaskRow";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { STAGES } from "../../data";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { fmt } from "../../utils/helpers/date";
import { isDone } from "../../utils/domain/tasks";
import { mapCr, mapFollowup, mapTask } from "../../utils/domain/views";
import MilestoneList from "../Deadlines/MilestoneList";
import RevisionList from "../Deadlines/RevisionList";
import BudgetCard from "./BudgetCard";
import CommitmentsCard from "./CommitmentsCard";
import StageGateCard from "./StageGateCard";
import { useData, useDeadlineRows, useFinRows, useStrict } from "../../app/useCrm";

function ListCard({ title, action, onAction, children }) {
  return (
    <Card className="pd-card">
      <div className="row row--between row--wrap gap-10 mb-10">
        <span className="label-caps fw-700 text-ink">{title}</span>
        <PillButton size="sm" className="pd-shadow-btn" onClick={onAction}>{action}</PillButton>
      </div>
      {children}
    </Card>
  );
}

/** Project detail — stages, gate, commitments, budget, tasks, follow-ups, deadlines, CRs. */
export default function ProjectDetail() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const data = useData();
  const strict = useStrict();
  const dl = useDeadlineRows().find((r) => r.id === projectId);
  const fin = useFinRows().find((r) => r.id === projectId);
  const p = data.projects.find((x) => x.id === projectId);

  const lists = useMemo(() => {
    if (!p) return null;
    const tasks = data.tasks.filter((t) => t.projectId === p.id);
    const fus = data.followups.filter((f) => f.projectId === p.id);
    return {
      tasks: tasks.map((t) => mapTask(t, data)),
      taskCount: tasks.filter((t) => !isDone(t)).length + " open",
      followups: fus.slice().sort((a, b) => a.status.localeCompare(b.status) || a.due.localeCompare(b.due)).map((f) => mapFollowup(f, data)),
      fuCount: fus.filter((f) => f.status === "pending").length + " pending",
      crs: data.crs.filter((c) => c.projectId === p.id).map((c) => mapCr(c, data, strict)),
    };
  }, [p, data, strict]);

  if (!p) {
    return (
      <div className="page">
        <EmptyState>This project is not available for your role.</EmptyState>
        <button type="button" className="link-inline align-self-start" onClick={() => navigate(pathFor("projects"))}>← All projects</button>
      </div>
    );
  }

  const open = (kind, extra = {}) => dispatch(modalOpened({ kind, extra: { projectId: p.id, ...extra } }));

  return (
    <div className="page">
      <div className="row row--wrap gap-10 pd-crumbs">
        <button type="button" className="link-inline" onClick={() => navigate(pathFor("projects"))}>← All projects</button>
        <span className="mono-meta">{p.code} · {p.billing} billing · Sales: {p.salesOwner} · Started {fmt(p.start)}</span>
      </div>

      <div className="row row--wrap gap-6">
        {STAGES.map((s, i) => (
          <div key={s} className={cx("pd-stage", i < p.stage ? "tone-ink" : i === p.stage ? "tone-lime pd-stage--current" : "tone-white")}>
            <span className="font-mono fs-10">{String(i).padStart(2, "0")}</span> · {s}
          </div>
        ))}
      </div>

      <div className="grid-auto min-320">
        <StageGateCard p={p} />
        <CommitmentsCard p={p} />
      </div>

      <BudgetCard p={p} fin={fin} />

      <div className="grid-auto min-320">
        <ListCard title={`Tasks · ${lists.taskCount}`} action="+ Task" onAction={() => open("task")}>
          <div className="stack gap-6">
            {lists.tasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </ListCard>
        <ListCard title={`Follow-ups · ${lists.fuCount}`} action="+ Follow-up" onAction={() => open("followup")}>
          <div className="stack gap-6">
            {lists.followups.map((f) => (
              <FollowupItem key={f.id} followup={f} variant="compact" />
            ))}
          </div>
        </ListCard>
      </div>

      {dl && (
        <Card className="stack gap-10 pd-card">
          <div className="row row--between row--wrap gap-10">
            <span className="label-caps fw-700 text-ink">Deadlines &amp; milestones · SOP §6</span>
            <div className="row row--wrap gap-10">
              <Pill size="md" bold tone={dl.statusTone}>{dl.status}</Pill>
              <span className="fs-12 text-body">
                Effective deadline <strong className="text-ink">{dl.effective}</strong> · <span className={`fw-700 text-${dl.leftColor}`}>{dl.leftLabel}</span>
              </span>
            </div>
          </div>
          <div className={`fs-12 fw-600 text-${dl.varianceColor}`}>{dl.varianceLabel} · {dl.slipLabel}</div>
          <div className="row row--wrap gap-10 fs-11 text-muted">
            Baseline {dl.baseline}
            {dl.hasRev && <span className="text-danger fw-600">{dl.revLabel}</span>}
            <PillButton size="xxs" onClick={() => open("revise", { to: p.deadline })}>Request deadline revision</PillButton>
          </div>
          <RevisionList projectId={p.id} revisions={dl.revisions} />
          <MilestoneList row={dl} variant="rows" />
        </Card>
      )}

      <Card className="pd-card">
        <div className="row row--between row--wrap gap-10 mb-10">
          <span className="label-caps fw-700 text-ink">Change requests · {lists.crs.length}</span>
          <PillButton size="sm" className="pd-shadow-btn" onClick={() => open("cr")}>+ Change request</PillButton>
        </div>
        {lists.crs.length === 0 && <EmptyState>No change requests logged. Every out-of-scope ask goes here before any work starts.</EmptyState>}
        <div className="stack gap-8">
          {lists.crs.map((c) => (
            <div key={c.id} className={`pd-cr tone-${c.rowTone}`}>
              <div>
                <span className="mono-meta">{c.id} · {c.kind}</span>
                <div className="fw-600 text-ink">{c.title}</div>
                <div className="meta">{c.detail}</div>
              </div>
              <div className="stack gap-6 pd-cr__side">
                <Pill tone={c.statusTone}>{c.status}</Pill>
                <CrNextButton cr={c} />
              </div>
              {c.needsEmail && <CrEmailToggle cr={c} />}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
