import { useDispatch } from "react-redux";
import { modalOpened, taskOpened } from "../../redux/slices/uiSlice";
import Card from "../common/Card";
import Pill from "../common/Pill";
import { useAction } from "../../app/useCrm";
import { deleteTask } from "../../utils/entities/taskUtils";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Task card used on the task board, My work, QA queues and team views.
 * Clicking opens the task drawer. `task` is a mapTask() view-model.
 */
export default function TaskCard({ task, showProject = true, children }) {
  const dispatch = useDispatch();
  const run = useAction();

  const edit = (e) => {
    e.stopPropagation();
    dispatch(modalOpened({ kind: "task", extra: { taskId: task.id, projectId: task.projectId, task } }));
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      run(deleteTask, { taskId: task.id });
    }
  };

  return (
    <Card size="md" className="stack gap-6 task-card" onClick={() => dispatch(taskOpened(task.id))}>
      <div className="row row--between gap-8 items-center">
        <span className="mono-meta ellipsis">{showProject ? `${task.project} · ${task.stage}` : task.stage}</span>
        <div className="row gap-4 items-center ml-auto">
          <Pill size="xs" tone={task.priorityTone}>{task.priority}</Pill>
          <button
            type="button"
            className="task-action-btn"
            title="Edit task"
            onClick={edit}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            className="task-action-btn task-action-btn--delete"
            title="Delete task"
            onClick={handleDelete}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      <div className="task-card__title">{task.title}</div>
      <div className={`fs-11 nowrap text-${task.dueColor}`}>
        {task.assignee} · {task.due} {task.overdueTag}
      </div>
      <div className="row row--wrap gap-4">
        {task.blocked && <Pill size="xs" tone="danger">BLOCKED</Pill>}
        {task.isPendingAccept && <Pill size="xs" tone={task.acceptTone}>{task.acceptLabel}</Pill>}
        {task.opsKind && <Pill size="xs" tone="ink800">INFRA · {task.opsKind}</Pill>}
        {task.handoverPending && <Pill size="xs" tone="paper">HANDOVER · ACK PENDING</Pill>}
        {task.bugCount > 0 && <Pill size="xs">{task.openBugs}/{task.bugCount} bugs</Pill>}
        <Pill size="xs" tone={task.statusTone}>{task.status}</Pill>
      </div>
      {children}
    </Card>
  );
}
