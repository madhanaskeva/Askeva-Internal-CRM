import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import FollowupItem from "../../components/cards/FollowupItem";
import TaskRow from "../../components/cards/TaskRow";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { STAGES } from "../../data";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { isDone } from "../../utils/domain/tasks";
import { mapCr, mapFollowup, mapTask } from "../../utils/domain/views";
import MilestoneList from "../Deadlines/MilestoneList";
import RevisionList from "../Deadlines/RevisionList";
import CommitmentsCard from "./CommitmentsCard";
import StageGateCard from "./StageGateCard";
import { useData, useDeadlineRows, useStrict } from "../../app/useCrm";

function ArrowPagination({ currentPage, totalPages, totalItems, pageSize = 6, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="row gap-6 items-center nav-pagination">
      <span className="fs-12 text-muted font-mono mr-4">
        {start}-{end} of {totalItems}
      </span>
      <button
        type="button"
        className="icon-btn-sm text-ink hover-bg-paper"
        onClick={onPrev}
        disabled={currentPage === 0}
        style={{ opacity: currentPage === 0 ? 0.3 : 1, cursor: currentPage === 0 ? "not-allowed" : "pointer" }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        className="icon-btn-sm text-ink hover-bg-paper"
        onClick={onNext}
        disabled={currentPage >= totalPages - 1}
        style={{ opacity: currentPage >= totalPages - 1 ? 0.3 : 1, cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer" }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function ListCard({ title, action, onAction, pagination, children }) {
  return (
    <Card className="pd-card">
      <div className="row row--between row--wrap gap-10 mb-10 items-center">
        <span className="label-caps fw-700 text-ink">{title}</span>
        <div className="row row--center gap-8 items-center">
          {pagination}
          <PillButton size="sm" className="pd-shadow-btn" onClick={onAction}>{action}</PillButton>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Project detail — stages, gate, commitments, tasks, follow-ups, deadlines, CRs. */
export default function ProjectDetail() {
  const { projectId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const data = useData();
  const strict = useStrict();
  const dl = useDeadlineRows().find((r) => r.id === projectId);
  const p = data.projects.find((x) => x.id === projectId);

  const [taskPage, setTaskPage] = useState(0);
  const [fuPage, setFuPage] = useState(0);
  const [selectedStage, setSelectedStage] = useState(p?.stage ?? 0);
  const gateRef = useRef(null);
  const scrollToGateOnChange = useRef(false);
  const taskPageSize = 10;
  const fuPageSize = 5;

  useEffect(() => {
    setSelectedStage(p?.stage ?? 0);
  }, [p?.id, p?.stage]);

  useEffect(() => {
    if (!scrollToGateOnChange.current) return;
    scrollToGateOnChange.current = false;
    requestAnimationFrame(() => gateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [selectedStage]);

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

  const taskTotalPages = Math.ceil((lists?.tasks?.length || 0) / taskPageSize);
  const safeTaskPage = Math.min(taskPage, Math.max(0, taskTotalPages - 1));
  const visibleTasks = useMemo(() => {
    if (!lists?.tasks) return [];
    const start = safeTaskPage * taskPageSize;
    return lists.tasks.slice(start, start + taskPageSize);
  }, [lists?.tasks, safeTaskPage]);

  const fuTotalPages = Math.ceil((lists?.followups?.length || 0) / fuPageSize);
  const safeFuPage = Math.min(fuPage, Math.max(0, fuTotalPages - 1));
  const visibleFollowups = useMemo(() => {
    if (!lists?.followups) return [];
    const start = safeFuPage * fuPageSize;
    return lists.followups.slice(start, start + fuPageSize);
  }, [lists?.followups, safeFuPage]);

  if (!p) {
    return (
      <div className="page">
        <EmptyState>This project is not available for your role.</EmptyState>
        <button type="button" className="link-inline align-self-start" onClick={() => navigate(pathFor("projects"))}>← All projects</button>
      </div>
    );
  }

  const open = (kind, extra = {}) => dispatch(modalOpened({ kind, extra: { projectId: p.id, ...extra } }));
  const editStage = (stage) => {
    if (stage !== selectedStage) scrollToGateOnChange.current = true;
    setSelectedStage(stage);
    if (stage === selectedStage) {
      requestAnimationFrame(() => gateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const returnToCurrentStage = () => {
    if (selectedStage !== p.stage) {
      scrollToGateOnChange.current = true;
      setSelectedStage(p.stage);
    } else {
      requestAnimationFrame(() => gateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <div className="page">
      <div className="row row--wrap gap-10 pd-crumbs">
        <button type="button" className="link-inline" onClick={() => navigate(pathFor("projects"))}>← All projects</button>
      </div>

      <div className="row row--wrap gap-6 items-center">
        {STAGES.map((s, i) => (
          <div key={s} className={cx("pd-stage", i < p.stage ? "tone-ink" : i === p.stage ? "tone-lime pd-stage--current" : "tone-white", i === selectedStage && "pd-stage--editing")}>
            <span className="font-mono fs-10">{String(i).padStart(2, "0")}</span> · {s}
            <button
              type="button"
              className="pd-stage__edit-btn"
              aria-label={`Edit ${s} stage`}
              title={`Edit ${s}`}
              onClick={() => editStage(i)}
            >
              <Pencil size={12} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      <div className="grid-auto min-320">
        <StageGateCard key={`${p.id}-${selectedStage}`} ref={gateRef} p={p} stage={selectedStage} onSaved={returnToCurrentStage} />
        <CommitmentsCard p={p} />
      </div>

      <div className="grid-auto min-320">
        <ListCard
          title={`Tasks · ${lists.taskCount}`}
          action="+ Task"
          onAction={() => open("task")}
          pagination={
            <ArrowPagination
              currentPage={safeTaskPage}
              totalPages={taskTotalPages}
              totalItems={lists.tasks.length}
              pageSize={taskPageSize}
              onPrev={() => setTaskPage((p) => Math.max(0, p - 1))}
              onNext={() => setTaskPage((p) => Math.min(taskTotalPages - 1, p + 1))}
            />
          }
        >
          <div className="stack gap-6">
            {visibleTasks.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        </ListCard>
        <ListCard
          title={`Follow-ups · ${lists.fuCount}`}
          action="+ Follow-up"
          onAction={() => open("followup")}
          pagination={
            <ArrowPagination
              currentPage={safeFuPage}
              totalPages={fuTotalPages}
              totalItems={lists.followups.length}
              pageSize={fuPageSize}
              onPrev={() => setFuPage((p) => Math.max(0, p - 1))}
              onNext={() => setFuPage((p) => Math.min(fuTotalPages - 1, p + 1))}
            />
          }
        >
          <div className="stack gap-6">
            {visibleFollowups.map((f) => (
              <FollowupItem key={f.id} followup={f} variant="compact" />
            ))}
          </div>
        </ListCard>
      </div>

      {dl && (
        <Card className="stack gap-10 pd-card">
          <div className="row row--between row--wrap gap-10 items-center">
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
        <div className="row row--between row--wrap gap-10 mb-10 items-center">
          <span className="label-caps fw-700 text-ink">Change requests · {lists.crs.length}</span>
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
              <div className="pd-cr__side">
                <Pill tone={c.statusTone} className="pd-cr__pill">{c.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
