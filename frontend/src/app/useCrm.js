// The only place where Redux (session + UI) meets the CRM data utils.
//
//   utils/  → data + localStorage, knows nothing about Redux
//   redux/  → session + UI state, knows nothing about CRM data
//   app/    → these hooks combine the two for pages and components
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectRole, selectSession, selectUi } from "../redux/selectors";
import { actionNoteChanged, modalClosed, modalOpened, taskClosed, toastShown } from "../redux/slices/uiSlice";
import { makeCtx } from "../utils/actions/context";
import {
  getActorName, getAlerts, getDeadlineRows, getFinMap, getFinRows, getHealthMap, getPmList, getPortfolio, getRulesFrom,
  getStrictFrom, scopeData, useCrmData,
} from "../utils/storage/crmData";
import { getAllowedViews, getNavCounts, getNavItems } from "../utils/domain/navigation";

/** Unscoped dataset — settings, syslog, staff admin and role switching use this. */
export const useFullData = useCrmData;

/** Dataset scoped to the signed-in role (a PM only sees their own projects). */
export function useData() {
  const full = useCrmData();
  const { role, pmId } = useSelector(selectSession);
  return scopeData(full, role, pmId);
}

export const useHealthMap = () => getHealthMap(useData());
export const useFinMap = () => getFinMap(useData());
export const usePortfolio = () => getPortfolio(useData());
export const useAlerts = () => getAlerts(useData());
export const useFinRows = () => getFinRows(useData());
export const useDeadlineRows = () => getDeadlineRows(useData());
export const usePms = () => getPmList(useCrmData());
export const useRules = () => getRulesFrom(useCrmData());
/** strictGates rule (defaults to on). */
export const useStrict = () => getStrictFrom(useCrmData());

/** Display name of the acting user. */
export function useMe() {
  const session = useSelector(selectSession);
  return getActorName(session, useCrmData());
}

/** Sidebar items with live counts for the signed-in role. */
export function useNavItems() {
  const role = useSelector(selectRole);
  const data = useData();
  const full = useCrmData();
  return getNavItems(role, getNavCounts(data, full, role));
}

/** Views the signed-in role may open. */
export const useAllowedViews = () => getAllowedViews(useSelector(selectRole));

/**
 * Run a data action / util with the current `ctx` (who, role, view, note) and
 * apply its result to the UI: toast the message, clear the note, open/close
 * modals and the task drawer. Returns the result.
 *
 *   const run = useAction();
 *   run(moveTask, taskId, "doing", note);
 *   run(toggleFollowup, { followupId });
 */
export function useAction() {
  const dispatch = useDispatch();
  const session = useSelector(selectSession);
  const { currentView, actionNote } = useSelector(selectUi);
  return useCallback(
    (action, ...args) => {
      const ctx = makeCtx({ session, view: currentView, note: actionNote });
      const result = action(ctx, ...args) || { ok: true };
      if (result.message) dispatch(toastShown(result.message));
      if (result.clearNote) dispatch(actionNoteChanged(""));
      if (result.openModal) dispatch(modalOpened(result.openModal));
      if (result.closeTask) dispatch(taskClosed());
      if (result.closeModal) dispatch(modalClosed());
      return result;
    },
    [dispatch, session, currentView, actionNote],
  );
}
