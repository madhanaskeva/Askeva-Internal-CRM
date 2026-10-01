import { useDispatch } from "react-redux";
import { taskOpened } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";

/** Compact task line (project detail): status pill + title + assignee/due. Opens the drawer. */
export default function TaskRow({ task }) {
  const dispatch = useDispatch();
  const open = () => dispatch(taskOpened(task.id));
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
    </div>
  );
}
