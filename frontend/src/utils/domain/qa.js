// QA workspace + QA analytics — port of the original QA blocks of renderVals
// (search/role filter, bugRow, qa lists, qaStats, qaSeverity, qaByDev, qaByProject,
// qaTimeline, qaTaskRows, qaRetestRows, qaNext, buildQa, teamQa).
import { BACK, FRONT, OPS, TS_LABEL } from "../../data";
import { TODAY, addDays, daysBetween, fmt, fmtDur, fmtTime, minsBetween } from "../helpers/date";
import { avg } from "../helpers/format";
import { DEV_TRACK, isDone, trackOf } from "./tasks";
import { bugStatusTone, severityTone } from "./tones";
import { mapTask } from "./views";

const projectOf = (data, id) => data.projects.find((p) => p.id === id) || {};

// ---------------------------------------------------------------- search & role filter
const matchRole = (item, rf) => {
  if (!rf || rf === "all") return true;
  const dev = item.developer || item.assignee || item.actor || item.name || "";
  const tester = item.tester || item.actor || "";
  const role = item.role || item.dept || "";
  const track = item.track || trackOf({ assignee: dev });
  if (rf === "pc") return dev === "PC" || item.owner === "PC" || role.includes("Project Coordinator") || role === "PC";
  if (rf === "ui") return FRONT.includes(dev) || role.includes("UI") || role.includes("Frontend") || track === "frontend";
  if (rf === "backend") return BACK.includes(dev) || role.includes("Backend") || role.includes("Senior Dev") || track === "backend";
  if (rf === "tester")
    return ["Tester", "Divya"].includes(dev) || ["Tester", "Divya"].includes(tester) || role.toLowerCase().includes("tester") || role.toLowerCase().includes("qa") || track === "qa";
  if (rf === "dev") return FRONT.includes(dev) || BACK.includes(dev) || OPS.includes(dev) || ["frontend", "backend", "devops"].includes(track);
  return true;
};

const matchSearch = (item, q) => {
  if (!q || !q.trim()) return true;
  const s = q.trim().toLowerCase();
  const text = [item.id, item.title, item.desc, item.module, item.developer, item.tester, item.assignee, item.project, item.client, item.evidence, item.result, item.status, item.severity, item.ref, item.text, item.note, item.who]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(s);
};

/** Matcher used by the QA queue lists (search text + role filter). */
export const qaMatcher = (search, roleFilter) => (item) => matchRole(item, roleFilter) && matchSearch(item, search);

// ---------------------------------------------------------------- queue tab
export function bugRow(b, data, bugAgeRed = 3) {
  const t = data.tasks.find((x) => x.id === b.taskId) || {};
  const closed = b.status === "Verified";
  const age = daysBetween(closed ? b.closedOn || b.retest || TODAY : TODAY, b.raised);
  return {
    id: b.id,
    taskId: b.taskId,
    project: projectOf(data, b.projectId).client,
    module: b.module || "General",
    task: t.title || "—",
    severity: b.severity,
    sevTone: severityTone(b.severity),
    desc: b.desc,
    developer: b.developer,
    tester: b.tester,
    status: b.notABug ? "Not a bug" : b.status,
    statusTone: bugStatusTone(b),
    result: b.result || "—",
    raised: fmt(b.raised),
    fixed: b.fixed ? fmt(b.fixed) : "—",
    retest: b.retest ? fmt(b.retest) : "—",
    age: age + "d",
    ageColor: !closed && age > bugAgeRed ? "danger" : "body",
  };
}

export function buildQaQueue(data, match) {
  const bugEventsOn = (date) => data.bugs.flatMap((b) => (b.history || []).filter((h) => h.date === date));
  const testsOn = (date) =>
    bugEventsOn(date).filter((h) => ["Retest", "Verified", "Reopened", "NotABug"].includes(h.to)).length +
    data.tasks.reduce((s, t) => s + (t.history || []).filter((h) => h.date === date && ["passed", "failed", "testing"].includes(h.to) && h.from !== h.to).length, 0);
  const openAges = data.bugs.filter((b) => b.status !== "Verified").map((b) => daysBetween(TODAY, b.raised));
  const closedAges = data.bugs.filter((b) => b.status === "Verified").map((b) => daysBetween(b.closedOn || b.retest || TODAY, b.raised));
  const rules = data.rules || {};
  const row = (b) => bugRow(b, data, rules.bugAgeRed ?? 3);
  const map = (t) => mapTask(t, data);
  const passedToday = data.tasks.filter((t) => (t.history || []).some((h) => h.date === TODAY && h.to === "passed"));
  const failedToday = data.tasks.filter((t) => (t.history || []).some((h) => h.date === TODAY && h.to === "failed"));

  const rework = {};
  data.tasks.forEach((t) => {
    const n = (t.history || []).filter((h) => h.to === "rework" && h.from !== h.to).length;
    if (n) rework[t.assignee] = (rework[t.assignee] || 0) + n;
  });
  data.bugs.forEach((b) => (rework[b.developer] = rework[b.developer] || 0));

  return {
    queue: data.tasks
      .filter((t) => t.status === "devdone" && match(t))
      .sort((a, b) => (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1) || a.due.localeCompare(b.due))
      .map(map),
    testing: data.tasks.filter((t) => t.status === "testing" && match(t)).map(map),
    retest: data.bugs.filter((b) => b.status === "Fixed" && match(b)).map(row),
    rejected: data.bugs.filter((b) => b.status === "Rejected" && match(b)).map(row),
    bugs: data.bugs
      .filter(match)
      .slice()
      .sort((a, b) => (a.status === "Verified" ? 1 : 0) - (b.status === "Verified" ? 1 : 0) || b.raised.localeCompare(a.raised))
      .map(row),
    counts: {
      queue: data.tasks.filter((t) => t.status === "devdone").length,
      testing: data.tasks.filter((t) => t.status === "testing").length,
      retest: data.bugs.filter((b) => b.status === "Fixed").length,
      open: data.bugs.filter((b) => b.status === "Open").length,
      blocked: data.tasks.filter((t) => t.blocked && !isDone(t)).length,
    },
    report: {
      date: fmt(TODAY),
      assigned: data.bugs.filter((b) => b.status !== "Verified").length,
      tested: testsOn(TODAY),
      passed: passedToday.length,
      failed: failedToday.length,
      retested: bugEventsOn(TODAY).filter((h) => ["Verified", "Reopened"].includes(h.to)).length,
      raised: data.bugs.filter((b) => b.raised === TODAY).length,
      pending: data.bugs.filter((b) => b.status === "Fixed" || b.status === "Retest").length,
    },
    metrics: [
      { label: "Bugs raised", value: data.bugs.length, sub: `${data.bugs.filter((b) => b.severity === "Critical" || b.severity === "High").length} high / critical` },
      { label: "Verified fixed", value: data.bugs.filter((b) => b.status === "Verified" && !b.notABug).length, sub: "passed retest" },
      { label: "Rejected · not a bug", value: data.bugs.filter((b) => b.notABug || b.status === "Rejected").length, sub: `${data.bugs.filter((b) => b.status === "Rejected").length} awaiting tester decision` },
      { label: "Avg open age", value: avg(openAges) + "d", sub: `closed bugs averaged ${avg(closedAges)}d` },
      { label: "Tests today", value: testsOn(TODAY), sub: `${[1, 2, 3, 4].map((n) => testsOn(addDays(TODAY, -n))).join(" · ")} on previous 4 days` },
    ],
    reworkByDev: Object.entries(rework)
      .sort((a, b) => b[1] - a[1])
      .map(([dev, n]) => {
        const bugs = data.bugs.filter((b) => b.developer === dev).length;
        return { dev, label: `${n} rework round(s) · ${bugs} bug(s)` };
      }),
  };
}

// ---------------------------------------------------------------- analytics
export function qaWindow(period) {
  const from = period === "today" ? TODAY : period === "yesterday" ? addDays(TODAY, -1) : period === "week" ? addDays(TODAY, -6) : TODAY.slice(0, 8) + "01";
  const to = period === "yesterday" ? addDays(TODAY, -1) : TODAY;
  const label =
    period === "today" ? "Today · " + fmt(TODAY)
      : period === "yesterday" ? "Yesterday · " + fmt(to)
      : period === "week" ? `This week · ${fmt(from)} – ${fmt(to)}`
      : `This month · ${fmt(from)} – ${fmt(to)}`;
  return { from, to, label, inWindow: (d) => d && d >= from && d <= to };
}

/** Active testers (by staff role) — from the unscoped staff list. */
export const activeTesters = (fullData) => (fullData.staff || []).filter((s) => /tester/i.test(s.role) && s.status === "Active").map((s) => s.name);

function qaStats(data, testers, name, qaIn, opts = {}) {
  const isT = (x) => (name ? x === name : testers.includes(x));
  const pOk = (t) => !opts.project || t.projectId === opts.project;
  const taskEv = data.tasks.flatMap((t) => (t.history || []).map((x) => ({ ...x, task: t }))).filter((x) => pOk(x.task) && (!opts.developer || x.task.assignee === opts.developer));
  const bugEv = data.bugs
    .flatMap((b) => (b.history || []).map((x) => ({ ...x, bug: b })))
    .filter((x) => pOk(x.bug) && (!opts.developer || x.bug.developer === opts.developer) && (!opts.severity || x.bug.severity === opts.severity));
  const mine = (x) => qaIn(x.date) && isT(x.actor);
  const received = taskEv.filter((x) => qaIn(x.date) && x.to === "devdone" && x.from !== x.to);
  const started = taskEv.filter((x) => mine(x) && x.to === "testing" && x.from !== x.to);
  const results = taskEv.filter((x) => mine(x) && ["passed", "failed"].includes(x.to) && x.from !== x.to);
  const testedIds = [...new Set([...started, ...results].map((x) => x.task.id))];
  const passed = results.filter((x) => x.to === "passed");
  const failed = results.filter((x) => x.to === "failed");
  const raised = data.bugs.filter((b) => pOk(b) && qaIn(b.raised) && isT(b.tester) && (!opts.severity || b.severity === opts.severity) && (!opts.developer || b.developer === opts.developer));
  const byTo = (to) => bugEv.filter((x) => mine(x) && x.to === to);
  const retested = byTo("Retest");
  const verified = byTo("Verified");
  const reopened = byTo("Reopened");
  const notABug = byTo("NotABug");
  const fixedByDev = bugEv.filter((x) => qaIn(x.date) && x.to === "Fixed" && (name ? x.bug.tester === name : true));
  const myBugs = data.bugs.filter(
    (b) => pOk(b) && (name ? b.tester === name : testers.includes(b.tester)) && (!opts.severity || b.severity === opts.severity) && (!opts.developer || b.developer === opts.developer),
  );
  const pend = {
    queue: data.tasks.filter((t) => pOk(t) && t.status === "devdone").length,
    waitFix: myBugs.filter((b) => ["Open", "Reopened"].includes(b.status)).length,
    waitRetest: myBugs.filter((b) => ["Fixed", "Retest"].includes(b.status)).length,
    critHigh: myBugs.filter((b) => ["Critical", "High"].includes(b.severity) && b.status !== "Verified").length,
    blocked: data.tasks.filter((t) => pOk(t) && t.blocked && !isDone(t)).length,
  };
  const fixToRetest = myBugs.filter((b) => b.fixed && b.retest && qaIn(b.retest)).map((b) => minsBetween(b.retest, b.retestTime, b.fixed, b.fixedTime)).filter((m) => m >= 0);
  const raiseToVerify = myBugs.filter((b) => b.closedOn && !b.notABug && qaIn(b.closedOn)).map((b) => minsBetween(b.closedOn, b.closedTime, b.raised, b.raisedTime)).filter((m) => m >= 0);
  const avgM = (a) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null);
  const passRate = results.length ? Math.round((passed.length / results.length) * 1000) / 10 : null;
  return {
    received: received.length,
    tested: testedIds.length,
    passed: passed.length,
    failed: failed.length,
    raised: raised.length,
    retested: retested.length,
    verified: verified.length,
    reopened: reopened.length,
    notABug: notABug.length,
    fixedByDev: fixedByDev.length,
    pend,
    passRate,
    failRate: passRate == null ? null : Math.round((100 - passRate) * 10) / 10,
    bugsPerTask: testedIds.length ? Math.round((raised.length / testedIds.length) * 100) / 100 : null,
    bugsPerFailed: failed.length ? Math.round((raised.length / failed.length) * 100) / 100 : null,
    fixToRetest: avgM(fixToRetest),
    raiseToVerify: avgM(raiseToVerify),
    testedIds,
    results,
    raisedList: raised,
    taskEv,
    bugEv,
    myBugs,
    statusBreak: ["Open", "Fixed", "Retest", "Verified", "Reopened"]
      .map((s) => ({
        label: s,
        n: myBugs.filter((b) =>
          s === "Verified" ? b.status === "Verified" && !b.notABug : s === "Reopened" ? b.status === "Open" && (b.history || []).some((x) => x.to === "Reopened") : b.status === s,
        ).length,
      }))
      .concat([{ label: "Not a bug", n: myBugs.filter((b) => b.notABug).length }]),
  };
}

const STATUS_TONE = { Open: "danger", Fixed: "lime", Retest: "paper", Verified: "green", Reopened: "ink800", "Not a bug": "white" };
const kpi = (label, value, sub, tone = "white") => ({ label, value, sub: sub || "", tone });
const RANK = { Critical: 0, High: 1, Medium: 2 };

/**
 * Full analytics for one tester (name) or all testers (name = null).
 * @param {{project?,developer?,severity?}} opts
 * @param {string|null} focusProject  project id drilled into
 */
export function buildQaAnalytics(data, testers, name, period, opts = {}, focusProject = null) {
  const { inWindow: qaIn } = qaWindow(period);
  const st = qaStats(data, testers, name, qaIn, opts);
  const task = (id) => data.tasks.find((t) => t.id === id) || {};
  const byActor = (x) => (name ? x.actor === name : testers.includes(x.actor));

  const taskRows = st.testedIds.map((id) => {
    const t = task(id);
    const ev = (t.history || []).filter((x) => qaIn(x.date));
    const rec = (t.history || []).filter((x) => x.to === "devdone").pop();
    const stt = ev.find((x) => x.to === "testing");
    const res = ev.filter((x) => ["passed", "failed"].includes(x.to) && x.from !== x.to).pop();
    return {
      id: t.id,
      projectId: t.projectId,
      title: t.title,
      project: projectOf(data, t.projectId).client,
      developer: t.assignee,
      received: rec ? fmtTime(rec.time) : "—",
      started: stt ? fmtTime(stt.time) : "—",
      result: res ? (res.to === "passed" ? "Passed" : "Failed") : "In testing",
      resultTone: res ? (res.to === "passed" ? "green" : "danger") : "lime",
      bugs: data.bugs.filter((b) => b.taskId === t.id && qaIn(b.raised)).length,
    };
  });

  const byProjectRaw = data.projects
    .map((p) => {
      const tIds = st.testedIds.filter((id) => task(id).projectId === p.id);
      const res = st.results.filter((x) => x.task.projectId === p.id);
      const bs = st.raisedList.filter((b) => b.projectId === p.id);
      const be = st.bugEv.filter((x) => x.bug.projectId === p.id && qaIn(x.date) && byActor(x));
      if (!(tIds.length + bs.length + be.length)) return null;
      return {
        id: p.id,
        client: p.client,
        code: p.code,
        tested: tIds.length,
        passed: res.filter((x) => x.to === "passed").length,
        failed: res.filter((x) => x.to === "failed").length,
        raised: bs.length,
        retested: be.filter((x) => x.to === "Retest").length,
        verified: be.filter((x) => x.to === "Verified").length,
        reopened: be.filter((x) => x.to === "Reopened").length,
        pendingQa: data.tasks.filter((t) => t.projectId === p.id && t.status === "devdone").length,
      };
    })
    .filter(Boolean);
  const totTested = byProjectRaw.reduce((s, x) => s + x.tested, 0) || 1;
  const byProject = byProjectRaw.map((r) => ({ ...r, share: Math.round((r.tested / totTested) * 100) }));
  const focus = focusProject && byProject.find((p) => p.id === focusProject);

  const devs = [...new Set([...st.testedIds.map((id) => task(id).assignee), ...st.raisedList.map((b) => b.developer)])].filter(Boolean);
  const byDev = devs
    .map((dv) => {
      const bs = st.raisedList.filter((b) => b.developer === dv);
      return {
        dev: dv,
        tested: st.testedIds.filter((id) => task(id).assignee === dv).length,
        raised: bs.length,
        critical: bs.filter((b) => b.severity === "Critical").length,
        high: bs.filter((b) => b.severity === "High").length,
        medium: bs.filter((b) => b.severity === "Medium").length,
        low: bs.filter((b) => b.severity === "Low").length,
        reopened: st.bugEv.filter((x) => qaIn(x.date) && x.to === "Reopened" && x.bug.developer === dv).length,
      };
    })
    .sort((a, b) => b.raised - a.raised);

  const severity = ["Critical", "High", "Medium", "Low"].map((sv) => {
    const bs = st.raisedList.filter((b) => b.severity === sv);
    const all = st.myBugs.filter((b) => b.severity === sv);
    return {
      sev: sv,
      tone: severityTone(sv),
      raised: bs.length,
      fixed: bs.filter((b) => b.fixed).length,
      retested: bs.filter((b) => b.retest).length,
      verified: bs.filter((b) => b.status === "Verified" && !b.notABug).length,
      open: all.filter((b) => ["Open", "Reopened"].includes(b.status)).length,
    };
  });

  const reopenedIn = (b) => (b.history || []).some((x) => x.to === "Reopened" && qaIn(x.date));
  const retests = st.myBugs
    .filter((b) => b.retest && qaIn(b.retest))
    .map((b) => ({
      id: b.id,
      taskId: b.taskId,
      project: projectOf(data, b.projectId).client,
      developer: b.developer,
      severity: b.severity,
      fixedAt: fmtTime(b.fixedTime),
      retestAt: fmtTime(b.retestTime),
      result: b.notABug ? "Not a bug" : b.status === "Verified" ? "Verified" : reopenedIn(b) ? "Reopened" : "In retest",
      tone: b.status === "Verified" ? "green" : reopenedIn(b) ? "danger" : "lime",
    }));

  const next = [
    ...data.bugs.filter((b) => b.status === "Fixed").map((b) => ({ kind: "Retest", id: b.id, taskId: b.taskId, label: b.desc, sev: b.severity, project: projectOf(data, b.projectId).client, rank: RANK[b.severity] ?? 3 })),
    ...data.tasks.filter((t) => t.status === "devdone").map((t) => ({ kind: "Test", id: t.id.toUpperCase(), taskId: t.id, label: t.title, sev: t.priority === "Med" ? "Medium" : t.priority, project: projectOf(data, t.projectId).client, rank: t.priority === "High" ? 1 : t.priority === "Med" ? 2 : 3 })),
  ]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8)
    .map((x, i) => ({ ...x, key: x.kind + x.id, n: i + 1, sevTone: x.rank <= 1 ? "ink" : "white" }));

  const showDate = !(period === "today" || period === "yesterday");
  const timeline = [
    ...st.taskEv
      .filter((x) => qaIn(x.date) && byActor(x) && x.from !== x.to)
      .map((x) => ({
        date: x.date,
        time: x.time || "",
        text: { testing: "Testing started", passed: "Passed", failed: "Failed" }[x.to] || TS_LABEL[x.to],
        ref: x.task.title,
        taskId: x.task.id,
        project: projectOf(data, x.task.projectId).client,
        note: x.note || "",
        color: x.to === "failed" ? "danger" : x.to === "passed" ? "green" : "ink",
      })),
    ...st.bugEv
      .filter((x) => qaIn(x.date) && byActor(x))
      .map((x) => ({
        date: x.date,
        time: x.time || "",
        text: { Open: "Bug raised", Retest: "Retest started", Verified: "Verified", Reopened: "Reopened", NotABug: "Marked not a bug" }[x.to] || x.to,
        ref: x.bug.id + " · " + x.bug.desc,
        taskId: x.bug.taskId,
        project: projectOf(data, x.bug.projectId).client,
        note: x.note || "",
        color: x.to === "Open" || x.to === "Reopened" ? "danger" : x.to === "Verified" ? "green" : "ink",
      })),
  ]
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map((x, i) => ({ ...x, key: i, when: (showDate ? fmt(x.date) + " · " : "") + fmtTime(x.time) }));

  const totStatus = Math.max(1, st.statusBreak.reduce((s, x) => s + x.n, 0));
  return {
    stats: st,
    kpis: [
      kpi("Tasks received", st.received, "entered QA queue"),
      kpi("Tasks tested", st.tested, "testing started or resulted", "ink800"),
      kpi("Passed", st.passed, st.passRate == null ? "—" : st.passRate + "% pass rate", "green"),
      kpi("Failed", st.failed, "each with a linked bug", st.failed ? "danger" : "white"),
      kpi("Bugs raised", st.raised, st.bugsPerTask == null ? "" : st.bugsPerTask + " per task tested"),
      kpi("Bugs retested", st.retested, "retest started", "lime"),
      kpi("Bugs verified", st.verified, "passed retest", "green"),
      kpi("Reopened", st.reopened, st.notABug + " not-a-bug", st.reopened ? "rose" : "white"),
    ],
    byProject,
    focus: focus ? { ...focus, tasks: taskRows.filter((r) => r.projectId === focus.id) } : null,
    bugActivity: [
      ["Bugs raised", st.raised],
      ["Fixed by developers", st.fixedByDev],
      ["Waiting for retest", st.pend.waitRetest],
      ["Retested", st.retested],
      ["Verified", st.verified],
      ["Reopened", st.reopened],
      ["Not a bug", st.notABug],
    ].map(([label, n]) => ({ label, n })),
    statusBreak: st.statusBreak.map((x) => ({ ...x, pct: Math.round((x.n / totStatus) * 100), tone: STATUS_TONE[x.label] })),
    severity,
    byDev,
    efficiency: [
      kpi("Fix → retest", fmtDur(st.fixToRetest), "developer Fixed → tester retest"),
      kpi("Raise → verified", fmtDur(st.raiseToVerify), "bug age at closure"),
      kpi("Pass rate", st.passRate == null ? "—" : st.passRate + "%", st.failRate == null ? "" : st.failRate + "% failure rate"),
      kpi("Bugs / failed task", st.bugsPerFailed == null ? "—" : st.bugsPerFailed, st.bugsPerTask == null ? "" : st.bugsPerTask + " bugs per task tested"),
    ],
    retests,
    pending: [
      ["Tasks waiting for test", st.pend.queue],
      ["Bugs waiting for developer fix", st.pend.waitFix],
      ["Bugs waiting for retest", st.pend.waitRetest],
      ["Critical / High pending", st.pend.critHigh],
      ["Tasks blocked", st.pend.blocked],
    ].map(([label, n]) => ({ label, n })),
    next,
    timeline,
  };
}

/** Per-tester summary rows for the Team QA page. */
export function perTesterRows(data, testers, period, opts) {
  const { inWindow } = qaWindow(period);
  return testers.map((n) => {
    const s = qaStats(data, testers, n, inWindow, opts);
    return { name: n, tested: s.tested, passed: s.passed, failed: s.failed, raised: s.raised, retested: s.retested, verified: s.verified, reopened: s.reopened, notABug: s.notABug, pending: s.pend.queue + s.pend.waitRetest };
  });
}

/** Developers that appear on dev-track tasks (Team QA developer filter). */
export const qaDevelopers = (data) => [...new Set(data.tasks.filter((t) => DEV_TRACK(t)).map((t) => t.assignee))].filter((x) => x && x !== "Unassigned");
