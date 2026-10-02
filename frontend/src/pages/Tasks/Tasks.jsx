import { useMemo, useState } from "react";
import { Input, Select } from "antd";
import TaskCard from "../../components/cards/TaskCard";
import ProjectSelect from "../../components/common/ProjectSelect";
import PillButton from "../../components/common/PillButton";
import { useProjectFilter } from "../../utils/helpers/useProjectFilter";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { modalOpened, toastShown } from "../../redux/slices/uiSlice";
import { canMove, dropTarget, isDone, transitionsFor } from "../../utils/domain/tasks";
import { TODAY, fmt } from "../../utils/helpers/date";
import { mapTask } from "../../utils/domain/views";
import { moveTask } from "../../utils/actions/taskActions";
import { cx } from "../../utils/helpers/classNames";
import { STAGES, TASK_BOARD_COLUMNS, TASK_CREATORS, TS_LABEL } from "../../data";
import { useAction, useData, useMe } from "../../app/useCrm";

const TEAM_LABEL = { ui: "UI", backend: "Backend", tester: "Tester", seniorDev: "Senior dev" };

const inColumn = (t, statuses) =>
  statuses[0] === "__unassigned" ? t.assignee === "Unassigned" && !isDone(t) : statuses.includes(t.status) && t.assignee !== "Unassigned";

/**
 * Task board. The PC (and other task creators) see every task with a project,
 * assignee and search filter; developers see only the tasks assigned to them.
 * Cards drag between columns — a drop runs the same workflow rules as the task drawer.
 */
export default function Tasks() {
  const dispatch = useDispatch();
  const run = useAction();
  const data = useData();
  const role = useSelector(selectRole);
  const me = useMe();
  const isCreator = TASK_CREATORS.includes(role);
  const { filter, setFilter, matches, selectedProjectId } = useProjectFilter(data.projects);
  const [assignee, setAssignee] = useState("all");
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tasks.filter((t) => matches(t) && (assignee === "all" || t.assignee === assignee) && (!q || t.title.toLowerCase().includes(q)));
  }, [data.tasks, matches, assignee, query]);

  const columns = useMemo(
    () =>
      TASK_BOARD_COLUMNS.map(([statuses, label, tone]) => ({
        key: label,
        statuses,
        label,
        tone,
        items: visible.filter((t) => inColumn(t, statuses)).sort((a, b) => a.due.localeCompare(b.due)).map((t) => mapTask(t, data)),
      })),
    [visible, data],
  );

  const stats = useMemo(() => {
    const open = visible.filter((t) => !isDone(t));
    return [
      { label: "Open", value: open.length },
      { label: "Overdue", value: open.filter((t) => t.due < TODAY).length, tone: "danger" },
      { label: "Awaiting acceptance", value: open.filter((t) => t.acceptance === "pending").length },
      { label: "Blocked", value: open.filter((t) => t.blocked).length, tone: "danger" },
    ];
  }, [visible]);

  const assigneeOptions = useMemo(
    () => [{ value: "all", label: "Everyone" }, ...[...new Set(data.tasks.map((t) => t.assignee))].sort().map((n) => ({ value: n, label: n }))],
    [data.tasks],
  );

  /** Open tasks per project, shown in the project picker. */
  const openByProject = useMemo(() => {
    const m = {};
    data.tasks.filter((t) => !isDone(t)).forEach((t) => (m[t.projectId] = (m[t.projectId] || 0) + 1));
    return m;
  }, [data.tasks]);
  const project = selectedProjectId ? data.projects.find((p) => p.id === selectedProjectId) : null;
  const team = project ? Object.entries(project.team || {}).filter(([, n]) => n && n !== "TBD") : [];

  const dragged = dragId ? data.tasks.find((t) => t.id === dragId) : null;
  /** "ok" / "no" for the column while a card is being dragged. */
  const dropState = (col) => {
    if (!dragged || inColumn(dragged, col.statuses)) return null;
    const to = dropTarget(dragged, col.statuses);
    return to && canMove(role, dragged, to, me) ? "ok" : "no";
  };

  const onDrop = (col) => {
    const t = dragged;
    setDragId(null);
    setOverCol(null);
    if (!t || inColumn(t, col.statuses)) return;
    const to = dropTarget(t, col.statuses);
    if (!to) {
      const next = transitionsFor(t).map(([s]) => TS_LABEL[s]).join(" / ") || "none";
      dispatch(toastShown(`A "${TS_LABEL[t.status]}" task can't move to ${col.label}. Next step: ${next}.`));
      return;
    }
    const res = run(moveTask, t.id, to);
    if (res.ok) dispatch(toastShown(`Moved to ${TS_LABEL[to]} · ${t.title}`));
  };

  return (
    <div className="page task-page">
      <div className="task-toolbar">
        <ProjectSelect projects={data.projects} value={filter} onChange={setFilter} counts={openByProject} countLabel="open" />
        <div className="task-toolbar__right">
          <Input
            allowClear
            className="brand-input input-pill task-toolbar__search"
            placeholder="Search tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isCreator && (
            <Select className="brand-input task-toolbar__select" value={assignee} options={assigneeOptions} onChange={setAssignee} showSearch optionFilterProp="label" popupMatchSelectWidth={false} />
          )}
          {isCreator && (
            <PillButton size="sm" tone="ink" className="btn-shadow-green" onClick={() => dispatch(modalOpened({ kind: "task", extra: { projectId: selectedProjectId } }))}>
              + Task
            </PillButton>
          )}
        </div>
      </div>

      {project && (
        <div className="project-bar">
          <span className="project-bar__name">{project.client}</span>
          <span className="project-bar__meta">{project.code}</span>
          <span className="project-bar__meta">Stage {project.stage} · {STAGES[project.stage]}</span>
          {project.deadline && <span className="project-bar__meta">Deadline {fmt(project.deadline)}</span>}
          <span className="project-bar__team">
            {team.map(([k, n]) => (
              <span key={k} className="project-bar__member">
                <span className="task-card__avatar">{n.slice(0, 1)}</span>
                {n} <span className="project-bar__role">{TEAM_LABEL[k] || k}</span>
              </span>
            ))}
          </span>
          <button type="button" className="role-back ml-auto" onClick={() => setFilter("all")}>Clear ✕</button>
        </div>
      )}

      <div className="task-stats">
        {stats.map((s) => (
          <div key={s.label} className={cx("task-stat", s.tone && s.value > 0 && `task-stat--${s.tone}`)}>
            <span className="task-stat__value">{s.value}</span>
            <span className="task-stat__label">{s.label}</span>
          </div>
        ))}
        <span className="task-stats__hint">Drag a card to the next column to move it</span>
      </div>

      <div className="board task-board">
        {columns.map((col) => {
          const state = dropState(col);
          return (
            <div
              key={col.key}
              className={cx("board-col", `tone-${col.tone}`, state && `drop-${state}`, overCol === col.key && state === "ok" && "drop-over")}
              onDragOver={(e) => {
                if (!dragged) return;
                e.preventDefault();
                if (overCol !== col.key) setOverCol(col.key);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setOverCol(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(col);
              }}
            >
              <div className="board-col__head">
                <span className="board-col__title">{col.label}</span>
                <span className="board-col__count">{col.items.length}</span>
              </div>
              <div className="board-col__body">
                {col.items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    dragging={dragId === t.id}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", t.id);
                      setDragId(t.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                  />
                ))}
                {col.items.length === 0 && <div className="board-col__empty">{state === "ok" ? "Drop here" : "No tasks"}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
