// Daily audit — person → date → assigned → done → blocked → evidence.
// Ported from the original `auditFor` / auditRows / auditNav in renderVals.
import { MANAGERS, TOP_ROLES } from "../../data";
import { TODAY, daysBetween, fmt } from "../helpers/date";
import { teamOf } from "./finance";
import { isDone } from "./tasks";

const RELEASE_EVENT = { requested: "Requested deploy", deployed: "Deployed", rolled_back: "Rolled back", go: "GO for production", approved: "Approved" };

export const auditKey = (person, date) => `${person}|${date}`;

/** Everything one person did (and had pending) on one date. */
export function auditFor(data, person, date) {
  const mine = data.tasks.filter((t) => t.assignee === person);
  const ev = (t) => (t.history || []).filter((h) => h.date === date);
  const started = mine.filter((t) => ev(t).some((h) => h.to === "doing" && h.from !== h.to));
  const completed = mine.filter((t) => ev(t).some((h) => h.to === "devdone" && h.from !== h.to));
  const blocked = mine.flatMap((t) =>
    ev(t)
      .filter((h) => /^BLOCKED/.test(h.note || ""))
      .map((h) => ({ task: t.title, note: h.note.replace(/^BLOCKED — /, "") })),
  );
  const assigned = mine.filter((t) => ((t.history || [])[0] || {}).date <= date && !(t.closedOn && t.closedOn < date));
  const pending = assigned.filter((t) => !isDone(t) && !completed.includes(t));
  const bugsFixed = data.bugs.filter((b) => (b.history || []).some((h) => h.date === date && h.to === "Fixed" && h.actor === person));
  const bugsRaised = data.bugs.filter((b) => b.raised === date && b.tester === person);
  const tests =
    data.bugs.reduce((s, b) => s + (b.history || []).filter((h) => h.date === date && h.actor === person && ["Retest", "Verified", "Reopened", "NotABug"].includes(h.to)).length, 0) +
    data.tasks.reduce((s, t) => s + (t.history || []).filter((h) => h.date === date && h.actor === person && ["passed", "failed", "testing"].includes(h.to) && h.from !== h.to).length, 0);
  const deployEv = (data.releases || []).flatMap((r) =>
    (r.history || [])
      .filter((x) => x.date === date && x.actor === person)
      .map((x) => ({ task: `${r.id} · ${r.version} → ${r.env}`, text: RELEASE_EVENT[x.to] || x.to })),
  );
  const allocEv = data.tasks.flatMap((t) =>
    (t.history || [])
      .filter((h) => h.date === date && h.actor === person && /^(ACCEPTED|DECLINED|HANDOVER —)/.test(h.note || ""))
      .map((h) => ({ task: t.title, text: h.note.replace(/^(ACCEPTED|DECLINED|HANDOVER) — /, (m) => m.replace(" — ", ": ")) })),
  );
  const lags = data.tasks
    .filter((t) => t.acceptedOn === date && t.assignee === person)
    .map((t) => daysBetween(t.acceptedOn, t.assignedOn || t.acceptedOn));
  const avgLag = lags.length ? Math.round((lags.reduce((s, x) => s + x, 0) / lags.length) * 10) / 10 : null;
  const declinesTotal = data.tasks.reduce((s, t) => s + (t.history || []).filter((h) => h.actor === person && /^DECLINED/.test(h.note || "")).length, 0);
  const crActions = data.crs.filter((c) => c.raised === date).length;
  const fuDone = data.followups.filter((f) => (f.log || []).some((l) => l.date === date)).length;
  let days = 0;
  data.projects.forEach((p) =>
    (p.effortLog || []).filter((e) => e.date === date && teamOf(p, e.role) === person).forEach((e) => {
      days += e.days;
    }),
  );
  const hours = days ? days * 8 : null;
  const activity =
    started.length + completed.length + blocked.length + bugsFixed.length + bugsRaised.length + tests + allocEv.length + deployEv.length + (person === "PC" ? crActions + fuDone : 0);
  const so = (data.signoffs || {})[auditKey(person, date)] || {};
  return {
    person,
    key: auditKey(person, date),
    assigned: assigned.map((t) => t.title),
    completed: completed.map((t) => ({ title: t.title, verified: isDone(t) ? "verified by tester" : t.status === "testing" ? "in testing" : "awaiting test" })),
    pending: pending.map((t) => t.title),
    blocked,
    bugsFixed: bugsFixed.map((b) => b.id + " · " + b.desc),
    bugsRaised: bugsRaised.map((b) => b.id + " · " + b.desc),
    tests,
    hours,
    hoursLabel: hours ? hours + " h logged" : "no effort logged",
    activity,
    alloc: [...allocEv, ...deployEv],
    allocMeta: `${avgLag === null ? "—" : avgLag + "d"} assign→accept · ${declinesTotal} decline(s) total`,
    pcSigned: !!so.pc,
    pmSigned: !!so.pm,
  };
}

const SELF_ONLY = ["Frontend", "Backend", "Tester", "DevOps"];

/** Audit rows for the given date; developers/testers only see themselves. */
export function auditRows(data, people, date, role, me) {
  const visible = SELF_ONLY.includes(role) ? people.filter((p) => p.name === me) : people;
  const top = TOP_ROLES.includes(role);
  return visible.map((p) => {
    const a = auditFor(data, p.name, date);
    const idle = a.activity === 0 && a.assigned.length > 0;
    return {
      ...a,
      role: p.role,
      isIdle: idle,
      noWork: a.activity === 0 && a.assigned.length === 0,
      canOpenDetail: MANAGERS.includes(role),
      canSignPC: role === "PC" && !a.pcSigned,
      canSignPM: (role === "PM" || top) && !a.pmSigned,
      summary: `${a.assigned.length} assigned · ${a.completed.length} completed · ${a.pending.length} pending · ${a.blocked.length} blocked · ${a.tests} tests · ${a.bugsFixed.length} bugs fixed`,
    };
  });
}

export const auditDateLabel = (date) => fmt(date) + (date === TODAY ? " · today" : "");

export const auditTotals = (rows) =>
  `${rows.filter((r) => r.activity > 0).length}/${rows.length} people active · ${rows.reduce((s, r) => s + r.completed.length, 0)} tasks completed · ${rows.reduce((s, r) => s + r.tests, 0)} tests · ${rows.reduce((s, r) => s + r.blocked.length, 0)} blockers · ${rows.filter((r) => r.pcSigned).length} PC sign-offs · ${rows.filter((r) => r.pmSigned).length} PM sign-offs`;
