import { useDispatch } from "react-redux";
import { modalOpened, taskOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { useAction } from "../../app/useCrm";
import { deleteTask } from "../../utils/entities/taskUtils";
import { Pencil, Trash2 } from "lucide-react";

/** Compact task line (project detail): status pill + title + assignee/due. Opens the drawer. */
export default function TaskRow({ task }) {
  const dispatch = useDispatch();
  const run = useAction();

  const open = () => dispatch(taskOpened(task.id));

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
    <div className={cx("list-row", `tone-${task.rowTone}`)}>
      <button type="button" title="Open task" className={cx("pill pill--xs pill-btn", `tone-${task.statusTone}`)} onClick={open}>
        {task.status}
      </button>
      <button type="button" className="link-block flex-1" onClick={open}>
        <div className={cx("fw-600 text-ink fs-12-5", task.done && "strike")}>{task.title}</div>
        <div className={`fs-11 text-${task.dueColor}`}>
          {task.assignee} · due {task.due} {task.overdueTag}
        </div>
      </button>
      <div className="row gap-4 items-center ml-auto">
        <button
          type="button"
          className="task-action-btn"
          title="Edit task"
          onClick={edit}
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          className="task-action-btn task-action-btn--delete"
          title="Delete task"
          onClick={handleDelete}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
