// Cross-page UI state only: things opened from many places (toast, task drawer,
// form modal, role switcher) and the shared action note. Page-local UI state
// (filters, tabs, periods) stays in component useState.
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  toast: null, // { id, message }
  taskId: null, // task drawer
  modal: null, // { kind, extra } — form modal (see src/forms)
  switchOpen: false, // role switch overlay
  /** One note field shared by task drawer, bug and deploy actions (as in the original). */
  actionNote: "",
  /** Current view key — recorded in the audit log. */
  currentView: "dashboard",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toastShown(state, { payload }) {
      state.toast = { id: (state.toast?.id || 0) + 1, message: payload };
    },
    taskOpened(state, { payload }) {
      state.taskId = payload;
      state.actionNote = "";
    },
    taskClosed(state) {
      state.taskId = null;
    },
    modalOpened(state, { payload: { kind, extra = {} } }) {
      state.modal = { kind, extra };
    },
    modalClosed(state) {
      state.modal = null;
    },
    switchOpened(state) {
      state.switchOpen = true;
    },
    switchClosed(state) {
      state.switchOpen = false;
    },
    actionNoteChanged(state, { payload }) {
      state.actionNote = payload;
    },
    viewChanged(state, { payload }) {
      state.currentView = payload;
    },
  },
});

export const {
  toastShown, taskOpened, taskClosed, modalOpened, modalClosed, switchOpened, switchClosed, actionNoteChanged, viewChanged,
} = uiSlice.actions;
export default uiSlice.reducer;
