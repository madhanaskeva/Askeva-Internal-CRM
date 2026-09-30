// Plain action helpers (no thunks): each function reads the current state and
// dispatches crm reducers straight on the store. Persistence to localStorage is
// handled by the store subscription (see redux/store.js → utils/storage).
import { store } from "../../redux/store";
import { toastShown } from "../../redux/slices/uiSlice";
import { TODAY, nowTime } from "../date";
import { actorName } from "../domain/tasks";

export const dispatch = (action) => store.dispatch(action);
export const getState = () => store.getState();

/** Build the `ctx` every crm reducer expects: who did it, as which role, from which view, when. */
export const makeCtx = (state) => ({
  actor: actorName(state.session, state.crm),
  role: state.session.role,
  view: state.ui.currentView,
  date: TODAY,
  time: nowTime(),
  ts: Date.now(),
});

/**
 * Dispatch a crm action with `ctx` injected. Use for mutations that need no
 * permission check:  withCtx(crmActions.followupToggled, { followupId })
 */
export const withCtx = (actionCreator, payload = {}) =>
  dispatch(actionCreator({ ...payload, ctx: makeCtx(getState()) }));

export const toast = toastShown;
