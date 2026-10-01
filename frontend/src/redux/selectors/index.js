// Session / UI selectors. CRM data selectors live in utils/storage/crmData.js.
import { TOP_ROLES } from "../../data";

export const selectSession = (s) => s.session;
export const selectRole = (s) => s.session.role;
export const selectUi = (s) => s.ui;
export const selectIsTop = (s) => TOP_ROLES.includes(s.session.role);
