import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { images } from "../../assets/images";
import { ROLE_LABEL } from "../../constants/crm";
import { LOGIN_PATH, pathFor, viewForPath } from "../../constants/routes";
import { useDispatch, useSelector } from "react-redux";
import { selectMe, selectRole } from "../../redux/selectors";
import { selectNavItems } from "../../redux/selectors/navSelectors";
import { signedOut } from "../../redux/slices/sessionSlice";
import { modalClosed, switchOpened, taskClosed } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/cx";

/** Dark left navigation: logo, signed-in user card, role-based nav with live counts. */
export default function Sidebar({ onNavigate, className }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const me = useSelector(selectMe);
  const role = useSelector(selectRole);
  const items = useSelector(selectNavItems);
  const current = viewForPath(pathname);

  const signOut = () => {
    dispatch(taskClosed());
    dispatch(modalClosed());
    dispatch(signedOut());
    navigate(LOGIN_PATH);
  };

  const isActive = (view) => current === view || (view === "projects" && current === "detail");

  return (
    <aside className={cx("sidebar", className)}>
      <div className="stack gap-12">
        <img src={images.logoGreen} alt="Askeva" className="sidebar__logo" />
        <div className="sidebar__user">
          <div className="stack gap-4">
            <span className="sidebar__user-name">{me}</span>
            <span className="sidebar__user-role">{ROLE_LABEL[role]}</span>
          </div>
          <div className="row gap-6">
            <button type="button" className="sidebar__btn sidebar__btn--primary" onClick={() => { dispatch(switchOpened()); onNavigate?.(); }}>
              Switch role
            </button>
            <button type="button" className="sidebar__btn sidebar__btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Main">
        {items.map((n) => (
          <div key={n.view}>
            <NavLink to={pathFor(n.view)} onClick={onNavigate} className={cx("nav-item", isActive(n.view) && "is-active")}>
              <span className="nav-item__dot" />
              <span className="nav-item__label">{n.label}</span>
              {n.count > 0 && <span className="nav-item__count">{n.count}</span>}
            </NavLink>
            {n.children.length > 0 && (
              <div className="nav-children">
                {n.children.map((c) => (
                  <NavLink key={c.view} to={pathFor(c.view)} onClick={onNavigate} className={cx("nav-item nav-child", current === c.view && "is-active")}>
                    <span className="nav-item__dot" />
                    <span className="nav-item__label">{c.label}</span>
                    {c.count > 0 && <span className="nav-item__count">{c.count}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar__footer">
        Askeva · 2026
        <br />
        SOP v2 · roles
      </div>
    </aside>
  );
}
