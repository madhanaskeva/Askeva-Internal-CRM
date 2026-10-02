import { Navigate } from "react-router-dom";
import { images } from "../../assets/images";
import { ROLE_NAV } from "../../data";
import { pathFor } from "../../utils/helpers/routes";
import RolePicker from "../../components/common/RolePicker";
import { useSelector } from "react-redux";
import { selectSession } from "../../redux/selectors";

/**
 * Sign-in: brand panel on the left, role picker on the right. The original
 * prototype had no real authentication — the user picks a role (then their
 * name, where a role has several people) and lands on that role's first view.
 */
export default function Login() {
  const { signedIn, role } = useSelector(selectSession);
  if (signedIn) return <Navigate to={pathFor(ROLE_NAV[role][0])} replace />;

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand">
          <img src={images.logoTile} alt="Ask Eva" className="login-brand__logo" />
          <div className="login-brand__text">
            <div className="login-brand__title">Askeva internal CRM</div>
            <div className="login-brand__sub">Projects · tasks · QA · deploys — one workflow, every role.</div>
          </div>
          <div className="login-brand__foot">Askeva · 2026 · SOP v2</div>
        </aside>

        <section className="login-panel">
          <div className="stack gap-4">
            <h1 className="overlay-title">
              Sign in<span className="text-brand">.</span>
            </h1>
            <div className="fs-12 text-body">Pick your role. Where a role has several people, pick your name next — developers only see the tasks assigned to them.</div>
          </div>
          <RolePicker />
        </section>
      </div>
    </div>
  );
}
