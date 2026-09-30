import { Navigate, Outlet } from "react-router-dom";
import { ROLE_NAV } from "../constants/crm";
import { LOGIN_PATH, pathFor } from "../constants/routes";
import { useSelector } from "react-redux";
import { selectSession } from "../redux/selectors";
import { selectAllowedViews } from "../redux/selectors/navSelectors";

/** Requires a signed-in user; otherwise sends them to the sign-in page. */
export function ProtectedRoute() {
  const { signedIn } = useSelector(selectSession);
  return signedIn ? <Outlet /> : <Navigate to={LOGIN_PATH} replace />;
}

/** Role guard: a view outside the role's navigation redirects to the role's landing view. */
export function RequireView({ view, children }) {
  const allowed = useSelector(selectAllowedViews);
  const { role } = useSelector(selectSession);
  return allowed.has(view) ? children : <Navigate to={pathFor(ROLE_NAV[role][0])} replace />;
}

/** "/" and unknown URLs → the current role's first view. */
export function HomeRedirect() {
  const { role, signedIn } = useSelector(selectSession);
  return <Navigate to={signedIn ? pathFor(ROLE_NAV[role][0]) : LOGIN_PATH} replace />;
}
