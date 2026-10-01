// Signed-in session (role, PM, client project) — survives a page refresh within the tab.
import { SESSION_KEY } from "../../data";
import { getSessionStorage, setSessionStorage } from "./storage";

export const loadSession = () => getSessionStorage(SESSION_KEY);
export const saveSession = (session) => setSessionStorage(SESSION_KEY, session);
