import { useState } from "react";
import { Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { modalOpened, taskOpened } from "../../redux/slices/uiSlice";
import { TASK_CREATORS } from "../../data";
import Card from "../common/Card";
import Pill from "../common/Pill";
import { useAction } from "../../app/useCrm";
import { deleteTask } from "../../utils/entities/taskUtils";
import { cx } from "../../utils/helpers/classNames";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Task card used on the task board, My work, QA queues and team views.
 * Clicking opens the task drawer. `task` is a mapTask() view-model.
 * Pass `onDragStart` / `onDragEnd` to make it draggable (task board).
 */
export default function TaskCard({ task, showProject = true, onDragStart, onDragEnd, dragging = false, children }) {
  const dispatch = useDispatch();
  const run = useAction();
  const role = useSelector(selectRole);
  const canManage = TASK_CREATORS.includes(role);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const edit = (e) => {
    e.stopPropagation();
    dispatch(modalOpened({ kind: "task", extra: { taskId: task.id, task: task.raw } }));
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setDeleteOpen(true);
  };

  const confirmDelete = () => {
    run(deleteTask, { taskId: task.id });
    setDeleteOpen(false);
  };

  const draggable = !!onDragStart;

  return (
    <>
      <Card
        size="md"
        className={cx("stack gap-6 task-card", draggable && "task-card--draggable", dragging && "is-dragging")}
        onClick={() => dispatch(taskOpened(task.id))}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="row row--between gap-8 items-center">
          <span className="mono-meta ellipsis">{showProject ? `${task.project} · ${task.stage}` : task.stage}</span>
          <div className="row gap-4 items-center ml-auto">
            <Pill size="xs" tone={task.priorityTone}>{task.priority}</Pill>
            {canManage && (
              <span className="task-card__actions">
                <span role="button" tabIndex={0} className="task-action-btn" title="Edit task" onClick={edit}>
                  <Pencil size={12} />
                </span>
                <span role="button" tabIndex={0} className="task-action-btn task-action-btn--delete" title="Delete task" onClick={handleDeleteClick}>
                  <Trash2 size={12} />
                </span>
              </span>
            )}
          </div>
        </div>
        <div className="task-card__title">{task.title}</div>
        <div className="row gap-6 items-center">
          <span className="task-card__avatar">{(task.assignee || "?").slice(0, 1)}</span>
          <span className="fs-11 fw-600 text-ink ellipsis">{task.assignee}</span>
          <span className={`fs-11 nowrap ml-auto text-${task.dueColor}`}>
            {task.due} {task.overdueTag}
          </span>
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

      <Modal
        open={deleteOpen}
        title="Delete task"
        onCancel={() => setDeleteOpen(false)}
        onOk={confirmDelete}
        okText="Delete"
        cancelText="Cancel"
        rootClassName="brand-modal"
        classNames={{ mask: "brand-mask" }}
        okButtonProps={{ className: "btn-pill tone-danger" }}
        cancelButtonProps={{ className: "btn-pill tone-white" }}
        destroyOnHidden
      >
        <div className="stack gap-8">
          <div className="fs-13 text-body">
            Are you sure you want to delete <strong className="text-ink">"{task.title}"</strong>?
          </div>
          <div className="fs-11 text-muted">This action is permanent and recorded in the system log.</div>
        </div>
      </Modal>
    </>
  );
}
