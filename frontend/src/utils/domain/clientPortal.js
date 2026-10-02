// Client portal view-model — port of the original "client portal" block of renderVals.
import { COMPLETED_STAGE, STAGES } from "../../data";
import { TODAY, daysBetween, fmt } from "../helpers/date";
import { inr } from "../helpers/format";
import { healthTone } from "./tones";

/** [stage, gateKey, label] — approvals the client can give from the portal. */
const CLIENT_APPROVALS = [
  [4, "dsApproved", "Approve the design system"],
  [4, "uiApproved", "Approve final UI (all screens)"],
  [5, "brd", "Confirm backend requirement document"],
  [5, "clientOk", "Approve tested build after demo"],
  [6, "signoff", "Confirm handover complete"],
];

const RELEASE_STATE = { requested: "Scheduled", go: "Approved · deploying soon", rolled_back: "Rolled back" };

/**
 * @param {object} data  role-scoped dataset
 * @param {object} cp    the selected project
 * @param {object} h     computeHealth(cp)
 */
export function buildClientPortal(data, cp, h) {
  const gate = (st, k) => ((cp.gates || {})[st] || {})[k];
  const inputs = cp.stage <= 4 ? !!gate(4, "inputs") : null;
  return {
    id: cp.id,
    project: cp.client,
    spoc: cp.spoc,
    code: cp.code,
    stage: STAGES[cp.stage],
    stages: STAGES.map((s, i) => ({ key: s, label: s, num: String(i).padStart(2, "0"), tone: i < cp.stage ? "ink" : i === cp.stage ? "lime" : "white" })),
    deadline: fmt(h.eff),
    leftLabel: h.left < 0 ? `${-h.left} days over` : `${h.left} days to go`,
    health: h.status,
    healthTone: healthTone(h.status),
    approvals: CLIENT_APPROVALS.filter(([st, k]) => cp.stage === st && !gate(st, k)).map(([stage, key, label]) => ({ stage, key, label })),
    crs: data.crs
      .filter((c) => c.projectId === cp.id)
      .map((c) => ({
        id: c.id,
        title: c.title,
        kind: c.kind,
        cost: c.cost,
        timeline: c.timeline,
        status: c.status,
        isQuoted: c.status === "Quoted",
        tone: c.status === "Approved" ? "green" : c.status === "Rejected" ? "danger" : c.status === "Quoted" ? "lime" : "white",
      })),
    pending: data.followups
      .filter((f) => f.projectId === cp.id && f.status === "pending" && (f.court || "us") === "client")
      .map((f) => ({ id: f.id, title: f.note || f.type, type: f.type, due: fmt(f.due), color: daysBetween(f.due, TODAY) < 0 ? "danger" : "ink" })),
    inputs:
      inputs === null
        ? null
        : { done: inputs, label: inputs ? "Inputs received — thank you" : "Logo, brand colours and page content are still needed" },
    testing:
      cp.stage === 5
        ? gate(5, "demo")
          ? "Demo environment is live — credentials shared with your SPOC. Please test and confirm."
          : "Build is in internal testing. Demo credentials will be shared once the Senior Developer approves the build."
        : cp.stage > 5
          ? "Testing complete and approved."
          : "Testing begins after UI approval and backend development.",
    handover:
      cp.stage >= COMPLETED_STAGE
        ? "Project handed over and closed."
        : cp.stage === 8
          ? `Handover in progress — ${["finalPay", "deploy", "dns", "creds", "kt", "manual", "training", "support"].filter((k) => gate(6, k)).length}/8 items done. Training is capped at 5 hours and recorded.`
          : "Handover follows final payment after testing approval.",
    invoices: (cp.invoices || []).map((i) => ({ id: i.id, label: i.label, date: fmt(i.date), amount: inr(i.amount), status: i.status, tone: i.status === "Received" ? "green" : "white" })),
    milestones: cp.milestones.map((m, index) => ({
      id: m.id,
      index,
      name: m.name,
      target: fmt(m.target),
      status: m.actual ? "Completed " + fmt(m.actual) : daysBetween(m.target, TODAY) < 0 ? "Delayed" : "Planned",
      color: m.actual ? "green" : daysBetween(m.target, TODAY) < 0 ? "danger" : "muted",
      done: !!m.actual,
      comments: (m.comments || []).slice().reverse().map((c, i) => ({ key: i, date: fmt(c.date), by: c.by, text: c.text })),
    })),
    releases: (data.releases || [])
      .filter((r) => r.projectId === cp.id && ["deployed", "rolled_back", "go", "requested"].includes(r.status))
      .sort((a, b) => b.requestedOn.localeCompare(a.requestedOn))
      .map((r) => ({
        id: r.id,
        version: r.version,
        env: r.env === "production" ? "Production" : "Staging",
        envTone: r.env === "production" ? "ink" : "paper",
        status: r.status === "deployed" ? "Live since " + fmt(r.deployedOn) : RELEASE_STATE[r.status],
        color: r.status === "rolled_back" ? "danger" : r.status === "deployed" ? "green" : "muted",
        notes: r.notes,
        url: r.status === "deployed" ? r.url : "",
      })),
    log: (cp.clientLog || []).slice().reverse().map((l, i) => ({ key: i, date: fmt(l.date), text: l.text })),
  };
}
