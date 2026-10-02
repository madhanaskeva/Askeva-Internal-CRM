// Escalation alerts (SOP §12) — port of the original `alerts` builder.
// Instead of closures, each alert carries a serialisable `target`:
//   { view, projectId? }  → navigate to a page
//   { taskId, view? }     → open the task drawer (optionally after navigating)
import { TODAY, daysBetween, fmt } from "../../utils/date";
import { inr } from "../../utils/format";
import { isDone } from "../tasks/tasks";

const L1 = { level: "L1 · PC", tone: "paper" };
const L2 = { level: "L2 · PM", tone: "lime" };
const L3 = { level: "L3 · Mgmt", tone: "green" };

export function buildAlerts(data, H, FIN) {
  const P = (id) => data.projects.find((p) => p.id === id) || {};
  const rules = data.rules || {};
  const pendingFu = data.followups.filter((f) => f.status === "pending");
  const overdueTasks = data.tasks.filter((t) => !isDone(t) && daysBetween(t.due, TODAY) < 0);
  const alerts = [];
  const add = (lvl, text, project, target) => alerts.push({ ...lvl, text, project, target });

  data.projects.filter((p) => p.onHold).forEach((p) => add(L2, `Project on hold since ${fmt(p.holdOn)} — ${p.holdReason}`, p.code, { view: "detail", projectId: p.id }));
  (data.releases || []).filter((r) => r.status === "requested" && r.env === "staging" && r.requestedOn < TODAY)
    .forEach((r) => add(L1, `Staging deploy waiting on DevOps since ${fmt(r.requestedOn)} — ${r.id} ${r.version}`, P(r.projectId).code, { view: "deploy" }));
  (data.releases || []).filter((r) => r.env === "production" && r.status === "requested")
    .forEach((r) => add(L2, `Production release ${r.version} awaiting gate approvals and PM GO`, P(r.projectId).code, { view: "deploy" }));
  (data.releases || []).filter((r) => r.status === "rolled_back" && daysBetween(TODAY, (r.history.slice(-1)[0] || {}).date || r.requestedOn) <= 7)
    .forEach((r) => add(L2, `Production rollback — ${r.version}: ${((r.history.slice(-1)[0] || {}).note || "").replace(/^ROLLBACK — /, "")}`, P(r.projectId).code, { view: "deploy" }));
  data.tasks.filter((t) => t.assignee === "Unassigned" && !isDone(t))
    .forEach((t) => add(L1, `Task declined by ${t.declinedBy || "developer"} — unassigned: ${t.title}`, P(t.projectId).code, { taskId: t.id }));
  data.tasks.filter((t) => t.acceptance === "pending" && (t.assignedOn || TODAY) < TODAY && !isDone(t))
    .forEach((t) => add(L2, `Not accepted same day — ${t.assignee} · ${t.title} (assigned ${fmt(t.assignedOn)})`, P(t.projectId).code, { taskId: t.id }));
  data.tasks.filter((t) => t.handover && !t.handover.ack)
    .forEach((t) => add(L1, `Handover awaiting PC acknowledgement — ${t.handover.from} → ${t.handover.to} · ${t.title}`, P(t.projectId).code, { taskId: t.id }));
  overdueTasks.forEach((t) => {
    const dd = -daysBetween(t.due, TODAY);
    add(dd > 2 ? L2 : L1, `Task overdue ${dd}d — ${t.title} · owner ${t.owner || "PC"} accountable · assignee ${t.assignee}${t.blocked ? " · BLOCKED" : ""}`, P(t.projectId).code, { view: "tasks", taskId: t.id });
  });
  data.tasks.filter((t) => t.overridden)
    .forEach((t) => add(L2, `Task closed without tester verification (override) — ${t.title}`, P(t.projectId).code, { view: "tasks", taskId: t.id }));
  data.bugs.filter((b) => b.status !== "Verified" && b.severity === "Critical")
    .forEach((b) => add(L2, `Critical bug open — ${b.id} ${b.desc}`, P(b.projectId).code, { view: "tasks", taskId: b.taskId }));
  pendingFu.filter((f) => daysBetween(f.due, TODAY) < 0)
    .forEach((f) => add(L1, `Follow-up missed — ${f.type} with ${f.with}`, P(f.projectId).code, { view: "detail", projectId: f.projectId }));
  data.crs.filter((c) => c.status === "Quoted" && !c.email && daysBetween(TODAY, c.raised) > 3)
    .forEach((c) => add(L2, `${c.id} quoted, no email confirmation for ${daysBetween(TODAY, c.raised)}d — do not start work`, P(c.projectId).code, { view: "detail", projectId: c.projectId }));
  data.projects.filter((p) => H[p.id].status === "Delayed")
    .forEach((p) => add(L2, `Deadline slip — ${H[p.id].overdueMs.map((m) => m.id).join(", ") || "final deadline"} overdue; inform client in writing`, p.code, { view: "deadlines" }));
  data.projects.filter((p) => H[p.id].uiDay > 10)
    .forEach((p) => add(L2, `UI phase on day ${H[p.id].uiDay} — beyond 7–10 day commitment`, p.code, { view: "deadlines" }));
  data.projects.filter((p) => FIN[p.id].overdueInv.length)
    .forEach((p) => add(L3, `Invoice overdue — ${FIN[p.id].overdueInv.map((i) => i.label).join(", ")} (${inr(FIN[p.id].overdueInv.reduce((s, i) => s + i.amount, 0))})`, p.code, { view: "finance" }));
  data.projects.filter((p) => FIN[p.id].burn > 100).forEach((p) => {
    const ov = p.overrun;
    add(L2, `Effort budget exceeded — ${FIN[p.id].burn}% of plan · ${!ov ? "PC must log a reason" : !ov.ack ? `reason: ${ov.category} — awaiting PM acknowledgement` : "acknowledged"}`, p.code, { view: "finance" });
  });
  data.projects.filter((p) => (p.revisions || []).some((r) => r.status === "Pending"))
    .forEach((p) => add(L2, `Deadline revision awaiting PM approval — ${p.revisions.filter((r) => r.status === "Pending").map((r) => fmt(r.from) + " → " + fmt(r.to)).join(", ")}`, p.code, { view: "deadlines" }));
  data.projects.filter((p) => (p.effortLog || []).some((e) => e.unapproved))
    .forEach((p) => add(L2, `${p.effortLog.filter((e) => e.unapproved).reduce((s, e) => s + e.days, 0)} days logged against unapproved CRs — unbilled scope creep`, p.code, { view: "finance" }));
  data.projects.filter((p) => (p.overrides || []).length)
    .forEach((p) => add(L2, `Stage gate overridden ${p.overrides.length}× while strictGates was off — review`, p.code, { view: "detail", projectId: p.id }));
  data.crs.filter((c) => c.overridden)
    .forEach((c) => add(L2, `${c.id} approved without client email (override)`, P(c.projectId).code, { view: "crs" }));
  const threshold = rules.marginThreshold ?? 20;
  data.projects.filter((p) => FIN[p.id].margin != null && FIN[p.id].margin < threshold)
    .forEach((p) => add(L2, `Forecast margin ${FIN[p.id].margin}% — below ${threshold}% threshold`, p.code, { view: "finance" }));
  data.projects.filter((p) => p.redesigns > (rules.redesignLimit ?? 2))
    .forEach((p) => add(L2, `${p.redesigns} UI redesign rounds — discuss with PM and client before continuing`, p.code, { view: "detail", projectId: p.id }));
  data.projects.filter((p) => p.stage === 0 && !(p.gates[0] || {}).payment)
    .forEach((p) => add(L1, "Payment not confirmed — onboarding must not start", p.code, { view: "detail", projectId: p.id }));

  const rank = (l) => (l.startsWith("L3") ? 3 : l.startsWith("L2") ? 2 : 1);
  alerts.sort((a, b) => rank(b.level) - rank(a.level));
  return alerts;
}

/** Collapse alerts into one summary row per escalation level (dashboard "Escalation watch"). */
export function summariseAlerts(alerts) {
  const rank = (l) => (l.startsWith("L3") ? 3 : l.startsWith("L2") ? 2 : 1);
  return [1, 2, 3]
    .map((r) => {
      const items = alerts.filter((a) => rank(a.level) === r);
      if (!items.length) return null;
      const owners = [...new Set(items.map((a) => a.level.split(" · ")[1]).filter(Boolean))].join(" / ");
      const projects = [...new Set(items.map((a) => a.project).filter(Boolean))].join(", ");
      return { level: `L${r}`, tone: items[0].tone, text: `${items.length} active alert${items.length === 1 ? "" : "s"} · ${owners}`, project: projects || "Portfolio", target: items[0].target };
    })
    .filter(Boolean);
}
