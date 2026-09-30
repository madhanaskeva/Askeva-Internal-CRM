import { useNavigate } from "react-router-dom";
import { ROLES, ROLE_LABEL, ROLE_NAV, ROLE_WHO } from "../../constants/crm";
import { pathFor } from "../../constants/routes";
import { useDispatch, useSelector } from "react-redux";
import { selectFullData, selectPms, selectSession } from "../../redux/selectors";
import { roleSelected } from "../../redux/slices/sessionSlice";
import { modalClosed, switchClosed, taskClosed } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/cx";

/**
 * Grid of role cards used by the sign-in page and the "Switch role" overlay.
 * The PM role expands into one card per active Project Manager (each sees only their projects).
 */
export default function RolePicker() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, pmId, signedIn } = useSelector(selectSession);
  const full = useSelector(selectFullData);
  const pms = useSelector(selectPms);

  const pick = (r, id = null) => {
    dispatch(roleSelected({ role: r, pmId: id }));
    dispatch(taskClosed());
    dispatch(modalClosed());
    dispatch(switchClosed());
    navigate(pathFor(ROLE_NAV[r][0]));
  };

  const cards = ROLES.flatMap((r) => {
    if (r !== "PM") return [{ key: r, label: ROLE_LABEL[r], who: ROLE_WHO[r] || "", active: signedIn && role === r, onPick: () => pick(r) }];
    return pms.map((pm) => ({
      key: "PM-" + pm.id,
      label: "PM · " + pm.name,
      who: `${pm.name} · ${full.projects.filter((p) => p.pmId === pm.id).length} project(s)`,
      active: signedIn && role === "PM" && (pmId === pm.id || (!pmId && pms[0].id === pm.id)),
      onPick: () => pick("PM", pm.id),
    }));
  });

  return (
    <div className="role-grid">
      {cards.map((c) => (
        <button key={c.key} type="button" className={cx("role-card", c.active ? "tone-lime" : "tone-white")} onClick={c.onPick}>
          <span>{c.label}</span>
          <span className="role-card__who">{c.who}</span>
        </button>
      ))}
    </div>
  );
}
