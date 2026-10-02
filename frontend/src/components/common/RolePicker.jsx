import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES, ROLE_DEFAULT_NAME, ROLE_LABEL, ROLE_NAV, ROLE_STAFF, ROLE_WHO } from "../../data";
import { pathFor } from "../../utils/helpers/routes";
import { useDispatch, useSelector } from "react-redux";
import { selectSession } from "../../redux/selectors";
import { roleSelected } from "../../redux/slices/sessionSlice";
import { modalClosed, switchClosed, taskClosed } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { useFullData, usePms } from "../../app/useCrm";

/**
 * Two-step sign-in used by the login page and the "Switch role" overlay:
 *   1. pick a role (Super admin · Admin · PM · PC · Front-end · Back-end · Tester · DevOps · Client);
 *   2. for PM / developer / tester roles with more than one person, pick your name
 *      (registered in Settings → Staff) — each developer only gets the tasks assigned to them.
 * Signing in lands on that role's first view.
 */
export default function RolePicker() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { role, pmId, staffName, signedIn } = useSelector(selectSession);
  const full = useFullData();
  const pms = usePms();
  const [picked, setPicked] = useState(null);
  const active = (full.staff || []).filter((s) => s.status === "Active");

  const signIn = (r, extra = {}) => {
    dispatch(roleSelected({ role: r, ...extra }));
    dispatch(taskClosed());
    dispatch(modalClosed());
    dispatch(switchClosed());
    navigate(pathFor(ROLE_NAV[r][0]));
  };

  const inboxCount = (name) => full.tasks.filter((t) => t.assignee === name && t.acceptance === "pending").length;

  /** People who can sign in as role `r` (empty for single-seat roles). */
  const peopleFor = (r) => {
    if (r === "PM")
      return pms.map((pm) => ({
        key: pm.id,
        name: pm.name,
        who: `${full.projects.filter((p) => p.pmId === pm.id).length} project(s)`,
        active: signedIn && role === "PM" && (pmId === pm.id || (!pmId && pms[0].id === pm.id)),
        extra: { pmId: pm.id },
      }));
    if (!ROLE_STAFF[r]) return [];
    const list = active.filter((s) => ROLE_STAFF[r].includes(s.role));
    const people = list.length ? list : [{ id: r, name: ROLE_DEFAULT_NAME[r], role: ROLE_LABEL[r] }];
    const me = staffName || ROLE_DEFAULT_NAME[r];
    return people.map((s) => {
      const n = inboxCount(s.name);
      return { key: s.id, name: s.name, who: n ? `${s.role} · ${n} in inbox` : s.role, active: signedIn && role === r && me === s.name, extra: { staffName: s.name } };
    });
  };

  const pickRole = (r) => {
    const people = peopleFor(r);
    if (people.length > 1) setPicked(r);
    else signIn(r, people[0]?.extra);
  };

  if (picked) {
    return (
      <div className="stack gap-10">
        <div className="row row--between gap-8">
          <span className="role-group__label">{ROLE_LABEL[picked]} · who are you?</span>
          <button type="button" className="role-back" onClick={() => setPicked(null)}>← All roles</button>
        </div>
        <div className="role-grid">
          {peopleFor(picked).map((p) => (
            <button key={p.key} type="button" className={cx("role-card", p.active ? "tone-lime" : "tone-white")} onClick={() => signIn(picked, p.extra)}>
              <span>{p.name}</span>
              <span className="role-card__who">{p.who}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="role-grid">
      {ROLES.map((r) => {
        const people = peopleFor(r);
        const who = people.length > 1 ? `${people.length} people · pick your name` : people[0] ? `${people[0].name} · ${people[0].who}` : ROLE_WHO[r] || "";
        return (
          <button key={r} type="button" className={cx("role-card", signedIn && role === r ? "tone-lime" : "tone-white")} onClick={() => pickRole(r)}>
            <span>{ROLE_LABEL[r]}</span>
            <span className="role-card__who">{who}</span>
          </button>
        );
      })}
    </div>
  );
}
