import { useMemo } from "react";
import { COMPLETED_STAGE, STAGES } from "../../constants/crm";
import { useSelector } from "react-redux";
import {
  selectAlerts, selectData, selectFinMap, selectFinRows, selectHealthMap, selectPortfolio,
} from "../../redux/selectors";
import { TODAY, daysBetween, fmt } from "../../utils/date";
import { inr } from "../../utils/format";
import { summariseAlerts } from "../../utils/domain/alerts";
import { isDone } from "../../utils/domain/tasks";
import { healthTone, stageTone } from "../../utils/domain/tones";
import { mapFollowup } from "../../utils/domain/views";

const SEVERITY = { Delayed: 0, "At risk": 1, "On track": 2, Completed: 3 };

/** All dashboard view-models — port of the original dashboard section of renderVals. */
export function useDashboard(sort) {
  const data = useSelector(selectData);
  const H = useSelector(selectHealthMap);
  const FIN = useSelector(selectFinMap);
  const port = useSelector(selectPortfolio);
  const alerts = useSelector(selectAlerts);
  const finRows = useSelector(selectFinRows);

  const base = useMemo(() => {
    const openTasks = data.tasks.filter((t) => !isDone(t));
    const overdueTasks = openTasks.filter((t) => daysBetween(t.due, TODAY) < 0);
    const pendingFu = data.followups.filter((f) => f.status === "pending");
    const dueFu = pendingFu.filter((f) => daysBetween(f.due, TODAY) <= 0);
    const openCrs = data.crs.filter((c) => c.status !== "Approved" && c.status !== "Rejected");
    const completed = data.projects.filter((p) => p.stage >= COMPLETED_STAGE).length;

    const stats = [
      { key: "done", label: "Completed projects", value: completed, sub: `${completed} of ${data.projects.length} total projects delivered`, tone: "lime", view: "projects" },
      { key: "active", label: "Active projects", value: data.projects.filter((p) => p.stage < COMPLETED_STAGE).length, sub: `${data.projects.filter((p) => p.stage === 4).length} in UI phase · ${data.projects.filter((p) => p.stage === 5).length} in backend`, tone: "white", view: "projects" },
      { key: "tasks", label: "Open tasks", value: openTasks.length, sub: `${overdueTasks.length} overdue`, tone: overdueTasks.length ? "ink800" : "white", view: "tasks" },
      { key: "fu", label: "Follow-ups due", value: dueFu.length, sub: `${pendingFu.filter((f) => daysBetween(f.due, TODAY) < 0).length} missed`, tone: "white", view: "followups" },
      { key: "crs", label: "Open CRs", value: openCrs.length, sub: `${data.crs.filter((c) => c.status === "Quoted" && !c.email).length} awaiting client email`, tone: "green", view: "crs" },
    ];

    const n = data.projects.length;
    const deadline = ["On track", "At risk", "Delayed"].map((s) => {
      const value = data.projects.filter((p) => H[p.id].status === s).length;
      return { label: s, value, tone: healthTone(s), pct: n ? Math.round((value / n) * 100) : 0 };
    });
    const active = data.projects.filter((p) => p.stage < 7);
    const analytics = {
      deadline,
      avgVariance: active.length ? Math.round(active.reduce((s, p) => s + (H[p.id].elapsed - H[p.id].done), 0) / active.length) : 0,
      totalSlip: Object.values(H).reduce((s, h) => s + h.slip, 0),
      totalExt: Object.values(H).reduce((s, h) => s + h.ext, 0),
      overdueMs: Object.values(H).reduce((s, h) => s + h.overdueMs.length, 0),
      burn: port.plannedStaff ? Math.round((port.actualStaff / port.plannedStaff) * 100) : 0,
      plannedStaff: inr(port.plannedStaff),
      actualStaff: inr(port.actualStaff),
      expenses: inr(port.expenses),
      forecastCost: inr(port.forecastCost),
      revenue: inr(port.revenue),
      received: inr(port.received),
      due: inr(port.due),
      forecastPL: inr(port.forecastPL),
      margin: port.margin + "%",
      cashPL: inr(port.cashPL),
    };

    const projectRows = data.projects.map((p) => {
      const h = H[p.id];
      return {
        id: p.id,
        client: p.client,
        code: p.code,
        stageLabel: `${p.stage} · ${STAGES[p.stage]}`,
        stageTone: stageTone(p.stage),
        pct: Math.round((p.stage / 7) * 100),
        health: h.status,
        healthTone: healthTone(h.status),
        deadlineLabel: `Deadline ${fmt(h.eff)} · ${h.left < 0 ? -h.left + "d over" : h.left + "d left"}`,
      };
    });

    return { stats, analytics, projectRows, todayFollowups: dueFu.map((f) => mapFollowup(f, data)) };
  }, [data, H, port]);

  const dashRows = useMemo(
    () =>
      finRows.slice().sort((a, b) => {
        const fa = FIN[a.id], fb = FIN[b.id], ha = H[a.id], hb = H[b.id];
        if (sort === "pl") return fa.forecastPL - fb.forecastPL;
        if (sort === "deadline") return ha.left - hb.left;
        if (sort === "burn") return fb.burn - fa.burn;
        return SEVERITY[ha.status] - SEVERITY[hb.status] || (fa.margin ?? 99) - (fb.margin ?? 99);
      }),
    [finRows, FIN, H, sort],
  );

  const escalations = useMemo(() => summariseAlerts(alerts), [alerts]);

  return { ...base, dashRows, escalations };
}
