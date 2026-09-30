import { useMemo } from "react";
import TaskCard from "../../components/cards/TaskCard";
import ChipGroup from "../../components/common/ChipGroup";
import PillButton from "../../components/common/PillButton";
import { useProjectFilter } from "./useProjectFilter";
import { useDispatch, useSelector } from "react-redux";
import { selectData, selectRole } from "../../redux/selectors";
import { modalOpened } from "../../redux/slices/uiSlice";
import { isDone, roleTrack, taskTrack } from "../../utils/domain/tasks";
import { mapTask } from "../../utils/domain/views";

const CAN_CREATE = ["PM", "PC", "DevOps", "Admin", "SuperAdmin"];

/** Board columns: [statuses, label, tone]. "__unassigned" collects declined tasks. */
const COLUMNS = [
  [["__unassigned"], "Unassigned · declined", "rose"],
  [["todo"], "To do", "white"],
  [["doing"], "In progress", "lime"],
  [["devdone", "testing"], "Testing", "paper"],
  [["failed", "rework"], "Failed · Rework", "rose"],
  [["passed", "closed"], "Passed · Closed", "ink800"],
];

/** Task board — developers see only their own track; everyone else sees all tasks. */
export default function Tasks() {
  const dispatch = useDispatch();
  const data = useSelector(selectData);
  const role = useSelector(selectRole);
  const { filter, setFilter, options, matches, selectedProjectId } = useProjectFilter();


  const columns = useMemo(() => {
    const track = roleTrack(role);
    const inFilter = (t) => matches(t) && (!track || taskTrack(t) === track);
    return COLUMNS.map(([statuses, label, tone]) => {
      const items = data.tasks
        .filter((t) => (statuses[0] === "__unassigned" ? t.assignee === "Unassigned" && !isDone(t) : statuses.includes(t.status) && t.assignee !== "Unassigned") && inFilter(t))
        .sort((a, b) => a.due.localeCompare(b.due))
        .map((t) => mapTask(t, data));
      return { label, tone, items };
    });
  }, [data, role, matches]);

  return (
    <div className="page">
      <div className="row row--wrap gap-8">
        <ChipGroup label="Project" options={options} value={filter} onChange={setFilter} />
        {CAN_CREATE.includes(role) && (
          <PillButton size="sm" tone="ink" className="ml-auto btn-shadow-green" onClick={() => dispatch(modalOpened({ kind: "task", extra: { projectId: selectedProjectId } }))}>
            + Task
          </PillButton>
        )}
      </div>

      <div className="board">
        {columns.map((col) => (
          <div key={col.label} className={`board-col tone-${col.tone}`}>
            <div className="board-col__head">
              <span className="board-col__title">{col.label}</span>
              <span className="board-col__count">{col.items.length}</span>
            </div>
            {col.items.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
