import { useDispatch } from "react-redux";
import { taskOpened } from "../../redux/slices/uiSlice";
import Card from "../common/Card";
import Pill from "../common/Pill";

/**
 * Task card used on the task board, My work, QA queues and team views.
 * Clicking opens the task drawer. `task` is a mapTask() view-model.
 */
export default function TaskCard({ task, showProject = true, children }) {
  const dispatch = useDispatch();
  return (
    <Card size="md" className="stack gap-6 task-card" onClick={() => dispatch(taskOpened(task.id))}>
      <div className="row row--between gap-8">
        <span className="mono-meta ellipsis">{showProject ? `${task.project} · ${task.stage}` : task.stage}</span>
        <Pill size="xs" tone={task.priorityTone}>{task.priority}</Pill>
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
