// Per-project row view-models shared by Dashboard, Finance, Deadlines and
// Project detail — ports of the original `finRows` and `deadlineRows`.
// Colours are returned as text-colour keys (see `.text-*`) and tone keys (`.tone-*`).
import { STAGES } from "../../constants/crm";
import { TODAY, daysBetween, fmt } from "../../utils/date";
import { inr } from "../../utils/format";
import { leftLabel as leftText, mapMilestone } from "../health/health";
import { healthTone, marginColor } from "../tones/tones";

const ROLE_SHORT = { ui: "UI", backend: "Backend", tester: "Tester", pc: "PC" };

/**
 * @param {object} p   project
 * @param {object} f   computeFin(p)
 * @param {object} h   computeHealth(p)
 * @param {(k:string)=>number} rate  role day-rate for this project (roleRate)
 */
export function buildFinRow(p, f, h, rate) {
  const ov = p.overrun;
  const unapprovedDays = (p.effortLog || []).filter((e) => e.unapproved).reduce((s, e) => s + e.days, 0);
  const variance = h.elapsed - h.done;
  return {
    id: p.id,
    client: p.client,
    code: p.code,
    billing: p.billing,
    stage: STAGES[p.stage],
    health: h.status,
    healthTone: healthTone(h.status),
    leftLabel: leftText(p, h),
    leftColor: h.left < 0 ? "danger" : "ink",
    variance: variance > 0 ? `${variance}% behind` : `${-variance}% ahead`,
    varianceColor: variance > 25 ? "danger" : "body",
    // effort / burn
    burn: Math.min(100, f.burn),
    burnRaw: f.burn,
    burnLabel: f.burn + "% of effort budget used",
    burnColor: f.burn > 100 ? "danger" : f.burn > 85 ? "green" : "ink",
    burnFill: f.burn > 100 ? "danger" : "ink",
    daysLabel: `${f.actualDays} / ${f.plannedDays} days`,
    staffLabel: `${inr(f.actualStaff)} / ${inr(f.plannedStaff)}`,
    staffActual: inr(f.actualStaff),
    staffPlan: `of ${inr(f.plannedStaff)} plan · ${f.burn}% used`,
    // money
    revenue: inr(f.revenue),
    hasCrRev: f.crRev > 0,
    crRevLabel: `incl. ${inr(f.crRev)} CRs`,
    received: inr(f.received),
    due: inr(f.due),
    dueColor: f.overdueInv.length ? "danger" : "body",
    overdueInvLabel: f.overdueInv.length ? `${f.overdueInv.length} overdue` : "",
    expenses: inr(f.expenses),
    forecastPL: inr(f.forecastPL),
    plColor: f.forecastPL < 0 ? "danger" : "ink",
    margin: f.margin == null ? "—" : f.margin + "%",
    marginColor: marginColor(f.margin),
    cashPL: inr(f.cashPL),
    cashColor: f.cashPL < 0 ? "danger" : "green",
    // overrun (effort budget exceeded)
    isOverrun: f.burn > 100,
    overrun: ov,
    overrunText: ov ? `${ov.category} — ${ov.note}` : "",
    overrunStatus: !ov ? "Reason required" : ov.ack ? "Acknowledged by PM" : "Awaiting PM acknowledgement",
    overrunTone: !ov ? "danger" : ov.ack ? "green" : "lime",
    unapprovedDays,
    effortLog: (p.effortLog || []).slice().reverse().slice(0, 6).map((e) => ({
      id: e.id,
      date: fmt(e.date),
      role: ROLE_SHORT[e.role] || e.role,
      days: e.days + "d",
      cr: e.crId || "Core scope",
      color: e.unapproved ? "danger" : "muted",
    })),
    invoices: (p.invoices || []).slice().sort((a, b) => a.date.localeCompare(b.date)).map((i) => {
      const rec = i.status === "Received";
      const over = !rec && daysBetween(i.date, TODAY) < 0;
      return { id: i.id, label: i.label, date: fmt(i.date), amount: inr(i.amount), status: rec ? "Received" : over ? "Overdue" : "Due", tone: rec ? "green" : over ? "danger" : "white" };
    }),
    expenseRows: (p.expenses || []).slice().sort((a, b) => b.date.localeCompare(a.date)).map((x) => ({ id: x.id, date: fmt(x.date), category: x.category, desc: x.desc, amount: inr(x.amount) })),
    effortRows: [
      ["ui", "UI / Frontend", (p.team || {}).ui, (p.budget || {}).uiDays, (p.effort || {}).ui],
      ["backend", "Backend", (p.team || {}).backend, (p.budget || {}).backendDays, (p.effort || {}).backend],
      ["tester", "Manual tester", (p.team || {}).tester, (p.budget || {}).testDays, (p.effort || {}).tester],
      ["pc", "Project Coordinator", "PC", (p.budget || {}).pcDays, (p.effort || {}).pc],
    ].map(([key, role, name, plan = 0, act = 0]) => ({
      key,
      role,
      name: name || "TBD",
      label: `${act || 0} / ${plan || 0} days`,
      cost: inr((act || 0) * rate(key)),
      pct: plan ? Math.min(100, Math.round(((act || 0) / plan) * 100)) : 0,
      over: (act || 0) > (plan || 0),
    })),
  };
}

/**
 * @param {object} p project, @param {object} h computeHealth(p)
 */
export function buildDeadlineRow(p, h) {
  const revDays = daysBetween(p.deadline, p.baselineDeadline || p.deadline);
  const variance = h.elapsed - h.done;
  return {
    id: p.id,
    client: p.client,
    code: p.code,
    billing: p.billing,
    status: h.status,
    statusTone: healthTone(h.status),
    deadline: fmt(p.deadline),
    deadlineIso: p.deadline,
    effective: fmt(h.eff),
    hasExt: h.ext > 0,
    extLabel: `+${h.ext}d approved via CR`,
    leftLabel: leftText(p, h),
    leftColor: h.left < 0 ? "danger" : h.left <= 5 ? "green" : "ink",
    elapsed: h.elapsed,
    done: h.done,
    varianceLabel: variance > 0 ? `${variance}% behind schedule` : `${-variance}% ahead`,
    varianceColor: variance > 25 ? "danger" : variance > 0 ? "body" : "green",
    slipLabel: h.slip ? `${h.slip}d cumulative slip` : "no slip so far",
    nextLabel: h.next ? `Next: ${h.next.id} ${h.next.name} · ${fmt(h.next.target)}` : "All milestones done",
    hasUi: h.uiDay != null,
    uiDay: h.uiDay,
    uiLabel: h.uiDay > 10 ? `UI day ${h.uiDay} — over 10-day commitment` : `UI day ${h.uiDay} of 7–10`,
    uiColor: h.uiDay > 10 ? "danger" : h.uiDay > 7 ? "green" : "ink",
    uiPct: Math.min(100, Math.round(((h.uiDay || 0) / 10) * 100)),
    baseline: fmt(p.baselineDeadline || p.deadline),
    hasRev: revDays !== 0,
    revLabel: revDays > 0 ? `revised +${revDays}d from baseline ${fmt(p.baselineDeadline)}` : `revised ${revDays}d from baseline ${fmt(p.baselineDeadline)}`,
    hasPending: (p.revisions || []).some((r) => r.status === "Pending"),
    revisions: (p.revisions || []).slice().reverse().map((r) => {
      const delta = daysBetween(r.to, r.from);
      return {
        id: r.id,
        date: fmt(r.date),
        fromTo: `${fmt(r.from)} → ${fmt(r.to)}`,
        delta: (delta > 0 ? "+" : "") + delta + "d",
        category: r.category,
        reason: r.reason,
        status: r.status,
        isPending: r.status === "Pending",
        tone: r.status === "Approved" ? "green" : r.status === "Rejected" ? "danger" : "lime",
      };
    }),
    milestones: p.milestones.map(mapMilestone),
  };
}
