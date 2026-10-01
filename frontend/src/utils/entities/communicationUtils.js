// Client communications (call MoM, WhatsApp logs, email confirmations).
import { STORAGE_KEYS, communications as defaultCommunications } from "../../data";
import { createCollection } from "../storage/collection";
import { addLog } from "./syslogUtils";

const communications = createCollection(STORAGE_KEYS.COMMUNICATIONS, defaultCommunications);

export const getCommunications = communications.getAll;

export function addCommunication(ctx, { communication }) {
  communications.add(communication);
  addLog(ctx);
}

export function toggleCommunicationCourt(ctx, { communicationId }) {
  communications.update(communicationId, (x) => ({ ...x, court: x.court === "client" ? "us" : "client" }));
  addLog(ctx);
}
