// Deadline health — port of the original `health(p)` and milestone mapping.
import { COMPLETED_STAGE } from "../../data";
import { TODAY, addDays, daysBetween, fmt } from "../helpers/date";
import { isDone } from "./tasks";

/** Timeline impact of a CR in days, parsed from "+4 days". */
export const crDays = (c) => {
  const m = /([+-]?\d+)/.exec(c.timeline || "");
  return m ? parseInt(m[1], 10) : 0;
};

/**
 * @returns {{ext:number, eff:string, left:number, overdueMs:object[], next:object, slip:number,
 *   status:"On track"|"At risk"|"Delayed"|"Completed", elapsed:number, done:number, uiDay:number|null}}
 */
export function computeHealth(p, data) {
  const ext = data.crs.filter((c) => c.projectId === p.id && c.status === "Approved").reduce((s, c) => s + crDays(c), 0);
  const eff = addDays(p.deadline, ext);
  const left = daysBetween(eff, TODAY);
  const overdueMs = p.milestones.filter((m) => !m.actual && daysBetween(m.target, TODAY) < 0);
  const next = p.milestones.find((m) => !m.actual);
  const slip = p.milestones.filter((m) => m.actual).reduce((s, m) => s + Math.max(0, daysBetween(m.actual, m.target)), 0);
  const otasks = data.tasks.filter((t) => t.projectId === p.id && !isDone(t) && daysBetween(t.due, TODAY) < 0).length;
  const total = Math.max(1, daysBetween(eff, p.start));
  const elapsed = Math.min(100, Math.max(0, Math.round((daysBetween(TODAY, p.start) / total) * 100)));
  const done = Math.round((p.milestones.filter((m) => m.actual).length / 7) * 100);
  let status = "On track";
  if (p.stage >= COMPLETED_STAGE) status = "Completed";
  else if (left < 0 || overdueMs.length) status = "Delayed";
  else if ((next && daysBetween(next.target, TODAY) <= 2) || otasks || elapsed - done > 25) status = "At risk";
  const uiDay = p.uiStart && p.stage === 4 ? daysBetween(TODAY, p.uiStart) + 1 : null;
  return { ext, eff, left, overdueMs, next, slip, status, elapsed, done, uiDay };
}

export function buildHealthMap(data) {
  const H = {};
  data.projects.forEach((p) => (H[p.id] = computeHealth(p, data)));
  return H;
}

/** "12d left" / "3d over" / "closed". */
export const leftLabel = (p, h) => (p.stage >= COMPLETED_STAGE ? "closed" : h.left < 0 ? `${-h.left}d over` : `${h.left}d left`);

/** Milestone row view-model (deadlines page + project detail). */
export const mapMilestone = (m) => {
  const done = !!m.actual;
  const dd = daysBetween(m.target, TODAY);
  const late = done ? daysBetween(m.actual, m.target) : 0;
  const over = !done && dd < 0;
  return {
    ...m,
    done,
    over,
    targetLabel: fmt(m.target),
    actualLabel: done ? fmt(m.actual) : over ? `overdue ${-dd}d` : dd === 0 ? "due today" : `in ${dd}d`,
    actualColor: over ? "danger" : done && late > 0 ? "danger" : done ? "green" : "muted",
    slipLabel: done ? (late > 0 ? `+${late}d late` : "on time") : "",
    rowTone: over ? "rose" : done ? "cream" : "white",
  };
};
