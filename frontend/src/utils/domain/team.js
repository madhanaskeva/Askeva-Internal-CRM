// Team / per-person record — ported from the original "team / per-person detail"
// and the `people` list of renderVals. Pure functions; colours are tone/text keys.
import { PERSON_RANGES, TS_LABEL } from "../../data";
import { TODAY, addDays, daysBetween, fmt } from "../helpers/date";
import { avg } from "../helpers/format";
import { teamOf } from "./finance";
import { isDone } from "./tasks";
import { bugStatusTone } from "./tones";
import { mapTask } from "./views";

/** Active staff excluding Admin / Project Manager — the people audited and shown on Team. */
export const teamPeople = (data) =>
  (data.staff || []).filter((s) => s.status === "Active" && !["Admin", "Project Manager"].includes(s.role)).map((s) => ({ name: s.name, role: s.role }));

/** Selected person: the requested name when it exists, otherwise the first person. */
export const resolvePerson = (people, name) => (people.some((p) => p.name === name) ? name : (people[0] || {}).name);

export const resolveRange = (range) => (PERSON_RANGES.some((r) => r.value === range) ? range : "today");

export const rangeStart = (range) => (range === "today" ? TODAY : range === "week" ? addDays(TODAY, -6) : "2000-01-01");

const projectOf = (data, id) => data.projects.find((p) => p.id === id) || {};

const stat = (label, value, sub, tone = "white") => ({ label, value, sub: sub || "", tone });

const effortDays = (data, person, inRange) => {
  let days = 0;
  data.projects.forEach((p) =>
    (p.effortLog || []).filter((e) => inRange(e.date) && teamOf(p, e.role) === person).forEach((e) => {
      days += e.days;
    }),
  );
  return days;
};

const logText = (h) =>
  h.from && h.from !== h.to ? `${TS_LABEL[h.from]} → ${TS_LABEL[h.to]}`
    : /^ACCEPTED/.test(h.note || "") ? "Accepted task"
    : /^DECLINED/.test(h.note || "") ? "Declined task"
    : /^HANDOVER/.test(h.note || "") ? "Handover"
    : /^BLOCKED/.test(h.note || "") ? "Blocked"
    : h.from ? TS_LABEL[h.to]
    : "Created task";

/**
 * Per-person detail for the Team page.
 * @param {object} data     role-scoped dataset
 * @param {{name,role}[]} people
 * @param {string} personName
 * @param {"today"|"week"|"all"} range
 */
export function personDetail(data, people, personName, range) {
  if (!personName) return null;
  const from = rangeStart(range);
  const inRange = (d) => d && d >= from && d <= TODAY;
  const P0 = people.find((p) => p.name === personName) || {};
  const isTester = /tester/i.test(P0.role || "");
  const isPC = personName === "PC";

  const mine = data.tasks.filter((t) => t.assignee === personName);
  const allTaskEv = data.tasks.flatMap((t) => (t.history || []).map((h) => ({ ...h, task: t })));
  const allBugEv = data.bugs.flatMap((b) => (b.history || []).map((h) => ({ ...h, bug: b })));
  const myTaskEv = allTaskEv.filter((h) => h.actor === personName && inRange(h.date));
  const myBugEv = allBugEv.filter((h) => h.actor === personName && inRange(h.date));
  const testEv = myTaskEv.filter((h) => ["passed", "failed"].includes(h.to) && h.from !== h.to);
  const testedTasks = [...new Set(testEv.map((h) => h.task.id))];
  const passed = testEv.filter((h) => h.to === "passed").length;
  const failed = testEv.filter((h) => h.to === "failed").length;
  const raised = data.bugs.filter((b) => b.tester === personName && inRange(b.raised));
  const verified = myBugEv.filter((h) => h.to === "Verified").length;
  const notABug =
    myBugEv.filter((h) => h.to === "NotABug").length +
    data.bugs.filter((b) => b.tester === personName && b.notABug && inRange(b.closedOn || b.raised)).length;
  const openOnDev = data.bugs.filter((b) => b.tester === personName && ["Open", "Reopened"].includes(b.status)).length;
  const retestPending = data.bugs.filter((b) => b.tester === personName && ["Fixed", "Retest"].includes(b.status)).length;
  const fixed = myBugEv.filter((h) => h.to === "Fixed").length;
  const rejected = myBugEv.filter((h) => h.to === "Rejected").length;
  const completed = myTaskEv.filter((h) => h.to === "devdone" && h.from !== "rework" && h.from !== h.to).length;
  const reworks = myTaskEv.filter((h) => h.to === "rework" && h.from !== h.to).length;
  const lag = mine.filter((t) => inRange(t.acceptedOn)).map((t) => daysBetween(t.acceptedOn, t.assignedOn || t.acceptedOn));
  const personEv = allTaskEv.filter((h) => h.actor === personName && inRange(h.date));
  const declines = personEv.filter((h) => /^DECLINED/.test(h.note || "")).length;
  const testLag = testEv
    .map((h) => {
      const dd = (h.task.history || []).filter((x) => x.to === "devdone" && x.date <= h.date).pop();
      return dd ? daysBetween(h.date, dd.date) : null;
    })
    .filter((x) => x !== null);
  const days = effortDays(data, personName, inRange);
  const effort = stat("Effort logged", days + "d", days ? days * 8 + " hours" : "no effort logged");
  const crCount = isPC ? data.crs.filter((c) => inRange(c.raised)).length : 0;
  const fuCount = isPC ? data.followups.filter((f) => (f.log || []).some((l) => inRange(l.date))).length : 0;

  const metrics = isTester
    ? [
        stat("Tasks tested", testedTasks.length, `${passed} passed · ${failed} failed`, "ink800"),
        stat("Bugs raised", raised.length, `${raised.filter((b) => ["Critical", "High"].includes(b.severity)).length} high / critical`),
        stat("Bugs verified", verified, "retest passed", "green"),
        stat("Rejected · not a bug", notABug, "accepted dev rejection"),
        stat("Open on dev", openOnDev, "waiting for fix", openOnDev ? "danger" : "white"),
        stat("Retests pending", retestPending, "fixed, not yet retested", "lime"),
        effort,
        stat("Avg devdone → tested", testLag.length ? avg(testLag) + "d" : "—", "turnaround"),
      ]
    : isPC
      ? [
          stat("Tasks created", personEv.filter((h) => !h.from).length, "allocated to team", "ink800"),
          stat("Change requests", crCount, "raised"),
          stat("Follow-ups done", fuCount, "logged"),
          stat("Handovers acked", personEv.filter((h) => /^HANDOVER ACK/.test(h.note || "")).length, ""),
          // Original counts closed events twice (myTaskEv + allTaskEv with the same filter) — kept for parity.
          stat("Tasks closed", myTaskEv.filter((h) => h.to === "closed").length + personEv.filter((h) => h.to === "closed").length, "after tester pass", "green"),
          effort,
        ]
      : [
          stat("Tasks completed", completed, "moved to Dev completed", "ink800"),
          stat("Tasks started", myTaskEv.filter((h) => h.to === "doing" && h.from === "todo").length, ""),
          stat("Bugs fixed", fixed, "sent for retest", "green"),
          stat("Bugs rejected", rejected, "as not-a-bug"),
          stat("Rework rounds", reworks, "failed → rework", reworks ? "rose" : "white"),
          stat("Open bugs", data.bugs.filter((b) => b.developer === personName && ["Open", "Reopened"].includes(b.status)).length, "on my name"),
          stat("Assign → accept", lag.length ? avg(lag) + "d" : "—", `${declines} decline(s)`, "lime"),
          effort,
        ];

  const tested = testEv
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((h, i) => ({
      key: `${h.task.id}-${h.date}-${i}`,
      taskId: h.task.id,
      date: fmt(h.date),
      task: h.task.title,
      project: projectOf(data, h.task.projectId).client,
      result: h.to === "passed" ? "Passed" : "Failed",
      tone: h.to === "passed" ? "green" : "danger",
      note: h.note || "",
    }));

  const bugs = data.bugs
    .filter((b) => (isTester ? b.tester === personName : isPC ? true : b.developer === personName))
    .filter((b) => inRange(b.raised) || (b.history || []).some((x) => inRange(x.date)))
    .sort((a, b) => b.raised.localeCompare(a.raised))
    .map((b) => ({
      id: b.id,
      taskId: b.taskId,
      desc: b.desc,
      severity: b.severity,
      project: projectOf(data, b.projectId).client,
      developer: b.developer,
      status: b.notABug ? "Not a bug" : b.status,
      statusTone: bugStatusTone(b),
      steps: [["Raised", b.raised], ["Fixed", b.fixed], ["Retest", b.retest], [b.notABug ? "Not a bug" : "Verified", b.closedOn]].map(([label, d]) => ({
        label,
        date: d ? fmt(d) : "—",
        done: !!d,
      })),
    }));

  const log = [
    ...myTaskEv.map((h) => ({
      date: h.date,
      text: logText(h),
      ref: h.task.title,
      note: (h.note || "").replace(/^(ACCEPTED|DECLINED|HANDOVER|BLOCKED) — /, ""),
      color: /^BLOCKED|^DECLINED/.test(h.note || "") || h.to === "failed" ? "danger" : h.to === "passed" || /^ACCEPTED/.test(h.note || "") ? "green" : "ink",
      taskId: h.task.id,
    })),
    ...myBugEv.map((h) => ({
      date: h.date,
      text: "Bug → " + h.to,
      ref: h.bug.id + " · " + h.bug.desc,
      note: h.note || "",
      color: h.to === "Open" || h.to === "Reopened" ? "danger" : h.to === "Verified" || h.to === "Fixed" ? "green" : "ink",
      taskId: h.bug.taskId,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((x, i) => ({ ...x, key: i, date: fmt(x.date) }));

  const byProject = data.projects
    .map((p) => {
      const tEv = myTaskEv.filter((h) => h.task.projectId === p.id);
      const bEv = myBugEv.filter((h) => h.bug.projectId === p.id);
      const openT = mine.filter((t) => t.projectId === p.id && !isDone(t)).length;
      const n = tEv.length + bEv.length;
      if (!n && !openT) return null;
      return {
        id: p.id,
        client: p.client,
        code: p.code,
        summary: isTester
          ? `${tEv.filter((h) => h.to === "passed").length} passed · ${tEv.filter((h) => h.to === "failed").length} failed · ${data.bugs.filter((b) => b.projectId === p.id && b.tester === personName && inRange(b.raised)).length} bugs raised`
          : `${tEv.filter((h) => h.to === "devdone" && h.from !== h.to).length} completed · ${bEv.filter((h) => h.to === "Fixed").length} bugs fixed · ${openT} open task(s)`,
      };
    })
    .filter(Boolean);

  return {
    name: personName,
    role: P0.role || "",
    isTester,
    metrics,
    tested,
    bugs,
    log,
    byProject,
    openTasks: mine.filter((t) => !isDone(t)).map((t) => mapTask(t, data)),
    rangeLabel: range === "today" ? "Today · " + fmt(TODAY) : range === "week" ? `Last 7 days · ${fmt(from)} – ${fmt(TODAY)}` : "All time",
  };
}
