// Client portal accounts.
import { STORAGE_KEYS } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const accounts = createCollection(STORAGE_KEYS.CLIENT_ACCOUNTS, []);

export const getClientAccounts = accounts.getAll;

export function toggleClientAccount(ctx, { accountId }) {
  accounts.update(accountId, (c) => ({ ...c, status: c.status === "Active" ? "Suspended" : "Active" }));
  addLog(ctx, "Client account toggled");
}
