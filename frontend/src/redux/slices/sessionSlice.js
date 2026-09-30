// Who is using the app. The original had no real authentication — the user picks
// a role (and, for PM, which Project Manager) from the sign-in / switch overlay.
import { createSlice } from "@reduxjs/toolkit";
import { loadSession } from "../../utils/storage/localStore";

const defaults = { role: "PM", pmId: null, signedIn: true, clientProject: "p1" };

const sessionSlice = createSlice({
  name: "session",
  initialState: () => ({ ...defaults, ...(loadSession() || {}) }),
  reducers: {
    roleSelected(state, { payload: { role, pmId = null } }) {
      state.role = role;
      state.pmId = pmId;
      state.signedIn = true;
    },
    signedOut(state) {
      state.signedIn = false;
    },
    /** Client portal: which project the SPOC is viewing. */
    clientProjectSelected(state, { payload }) {
      state.clientProject = payload;
    },
  },
});

export const { roleSelected, signedOut, clientProjectSelected } = sessionSlice.actions;
export default sessionSlice.reducer;
