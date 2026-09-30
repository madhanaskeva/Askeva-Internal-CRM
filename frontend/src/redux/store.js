import { configureStore } from "@reduxjs/toolkit";
import { saveCrmData, saveSession } from "../utils/storage/localStore";
import crmReducer from "./slices/crmSlice";
import sessionReducer from "./slices/sessionSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    crm: crmReducer,
    session: sessionReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) =>
    // No thunks — actions live in utils/actions and dispatch plain reducers.
    // The dataset is large; skip the dev-only deep checks to keep interactions snappy.
    getDefault({ thunk: false, immutableCheck: false, serializableCheck: false }),
});

// Write to localStorage whenever the crm dataset or the session changes
// (reference check, so ui-only updates like typing a note don't trigger a save).
let prev = store.getState();
store.subscribe(() => {
  const next = store.getState();
  if (next.crm !== prev.crm) saveCrmData(next.crm);
  if (next.session !== prev.session) saveSession(next.session);
  prev = next;
});
