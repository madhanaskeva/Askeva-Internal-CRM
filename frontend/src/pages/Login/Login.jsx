import { Navigate } from "react-router-dom";
import { images } from "../../assets/images";
import { ROLE_NAV } from "../../constants/crm";
import { pathFor } from "../../constants/routes";
import RolePicker from "../../components/common/RolePicker";
import { useSelector } from "react-redux";
import { selectSession } from "../../redux/selectors";

/**
 * Sign-in. The original prototype had no real authentication: the user chooses
 * who they are signing in as. Picking a role lands on that role's first view.
 */
export default function Login() {
  const { signedIn, role } = useSelector(selectSession);
  if (signedIn) return <Navigate to={pathFor(ROLE_NAV[role][0])} replace />;

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="stack gap-4">
          <img src={images.logoInk} alt="Askeva" className="logo-ink" />
          <h1 className="overlay-title">
            Sign in<span className="text-brand">.</span>
          </h1>
          <div className="fs-12 text-body">Choose who you are signing in as. Authentication is out of scope for this prototype.</div>
        </div>
        <RolePicker />
      </div>
    </div>
  );
}
