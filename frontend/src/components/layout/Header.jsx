import { CalendarDays } from "lucide-react";
import { ROLE_LABEL } from "../../constants/crm";
import { VIEW_TITLES } from "../../constants/routes";
import { useDispatch, useSelector } from "react-redux";
import { selectData, selectMe, selectRole } from "../../redux/selectors";
import { modalOpened } from "../../redux/slices/uiSlice";
import { TODAY, fmt } from "../../utils/date";
import PillButton from "../common/PillButton";

const CAN_CREATE = ["PM", "PC", "DevOps", "Admin", "SuperAdmin"];
const DEV_ROLES = ["Frontend", "Backend", "DevOps"];

/** Page header: eyebrow + display title, today's date and the "+ New project" CTA. */
export default function Header({ view, projectId }) {
  const dispatch = useDispatch();
  const role = useSelector(selectRole);
  const me = useSelector(selectMe);
  const project = useSelector((s) => (projectId ? selectData(s).projects.find((p) => p.id === projectId) : null));

  let [eyebrow, title] = VIEW_TITLES[view] || VIEW_TITLES.dashboard;
  if (view === "detail") title = project?.client || "Project";
  if (view === "mywork") eyebrow = `${ROLE_LABEL[role]} · ${me}`;
  if (view === "tasks") eyebrow = DEV_ROLES.includes(role) ? "Task board · my track only" : role === "Tester" ? "Task board · every track" : "Task management";

  return (
    <header className="app-header">
      <div>
        <div className="app-header__eyebrow">{eyebrow}</div>
        <h1 className="app-header__title">
          {title}
          <span className="app-header__title-dot">.</span>
        </h1>
      </div>
      <div className="row row--wrap gap-10">
        <div className="date-badge">
          <CalendarDays size={15} strokeWidth={2} />
          <span>Today · {fmt(TODAY)} {TODAY.slice(0, 4)}</span>
        </div>
        {CAN_CREATE.includes(role) && (
          <PillButton tone="green" shadow onClick={() => dispatch(modalOpened({ kind: "project" }))}>
            + New project
          </PillButton>
        )}
      </div>
    </header>
  );
}
