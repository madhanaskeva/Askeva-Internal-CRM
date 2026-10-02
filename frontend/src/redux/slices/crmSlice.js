// The CRM dataset (projects, tasks, bugs, releases, staff, …) — single source of
// truth, persisted to localStorage (features/storage/localStore.js) by the store subscription in redux/store.js.
import { createSlice } from "@reduxjs/toolkit";
import { loadCrmData } from "../../features/storage/localStore";
import { adminReducers } from "./crm/adminReducers";
import { projectReducers } from "./crm/projectReducers";
import { releaseReducers } from "./crm/releaseReducers";
import { taskReducers } from "./crm/taskReducers";
import { workReducers } from "./crm/workReducers";

const crmSlice = createSlice({
  name: "crm",
  initialState: loadCrmData,
  reducers: {
    /** Replace the whole dataset (demo reset). */
    dataReplaced: (_state, { payload }) => payload,
    ...taskReducers,
    ...releaseReducers,
    ...projectReducers,
    ...workReducers,
    ...adminReducers,
  },
});

export const crmActions = crmSlice.actions;
export default crmSlice.reducer;
