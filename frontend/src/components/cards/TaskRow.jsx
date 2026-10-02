import { useState } from "react";
import { Modal } from "antd";
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
  const [deleteOpen, setDeleteOpen] = useState(false);

  const open = () => dispatch(taskOpened(task.id));

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

  return (
    <>
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
            onClick={handleDeleteClick}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

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
