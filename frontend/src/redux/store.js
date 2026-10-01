// Redux holds UI and session state only. CRM data (projects, tasks, …) lives in
// localStorage through utils/entities/*Utils.js and is read with utils/storage/crmData.js.
import { configureStore } from "@reduxjs/toolkit";
import { saveSession } from "../utils/storage/persistence";
import sessionReducer from "./slices/sessionSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    session: sessionReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault({ thunk: false }),
});

// Keep the signed-in session across a refresh.
let prev = store.getState().session;
store.subscribe(() => {
  const next = store.getState().session;
  if (next !== prev) saveSession(next);
  prev = next;
});
