import { useMemo } from "react";
import { COMPLETED_STAGE, TS_LABEL } from "../../constants/crm";
import { useSelector } from "react-redux";
import { selectData, selectIsTop, selectRole } from "../../redux/selectors";
import { APPROVERS } from "../../utils/actions/releaseActions";
import { fmt } from "../../utils/date";
import { isDone } from "../../utils/domain/tasks";
import { RELEASE_STATUS, taskStatusTone } from "../../utils/domain/tones";

const HISTORY_TEXT = { requested: "Requested", deployed: "Deployed", rolled_back: "Rolled back", go: "GO for production", approved: "Approval" };

/** Production gates for a release (empty for staging). */
function productionGates(r, data, relTasks, role) {
  if (r.env !== "production") return [];
  const ap = r.approvals || {};
  return [
    { label: "Tester passed all tasks in release", ok: relTasks.length > 0 && relTasks.every(isDone) },
    { label: "Senior Dev approval", ok: !!ap.seniorDev, who: "seniorDev" },
    { label: "PM approval", ok: !!ap.pm, who: "pm" },
    { label: "Client approval (demo accepted)", ok: !!ap.client, who: "client" },
    {
      label: "No open Critical / High bugs",
      ok: !data.bugs.some((b) => b.projectId === r.projectId && ["Critical", "High"].includes(b.severity) && b.status !== "Verified"),
    },
  ].map((g) => ({ ...g, canApprove: !g.ok && !!g.who && (APPROVERS[g.who] || []).includes(role) }));
}

/** Deploy page view-models — port of the original "deploy" section of renderVals. */
export function useDeploy() {
  const data = useSelector(selectData);
  const role = useSelector(selectRole);
  const top = useSelector(selectIsTop);

  return useMemo(() => {
    const isDevOps = role === "DevOps";
    const canOperate = isDevOps || role === "PM" || top;
    const P = (id) => data.projects.find((p) => p.id === id) || {};

    const mapRel = (r) => {
      const p = P(r.projectId);
      const st = RELEASE_STATUS[r.status] || { label: r.status, tone: "white" };
      const relTasks = r.tasks.map((id) => data.tasks.find((t) => t.id === id)).filter(Boolean);
      const gates = productionGates(r, data, relTasks, role);
      return {
        id: r.id,
        project: p.client,
        env: r.env,
        envLabel: r.env === "production" ? "PRODUCTION" : "STAGING",
        envTone: r.env === "production" ? "ink" : "paper",
        version: r.version,
        tag: r.tag,
        notes: r.notes,
        url: r.url,
        requestedBy: r.requestedBy,
        requestedOn: fmt(r.requestedOn),
        statusLabel: st.label,
        statusTone: st.tone,
        isDeployed: r.status === "deployed",
        isRolledBack: r.status === "rolled_back",
        deployedLabel: r.deployedOn ? `${r.deployedBy} · ${fmt(r.deployedOn)} · smoke ${r.smoke || "—"} · downtime ${r.downtime || "—"}` : "",
        tasks: relTasks.map((t) => ({ id: t.id, title: t.title, status: TS_LABEL[t.status], tone: taskStatusTone(t.status) })),
        gates,
        canDeploy: canOperate && ((r.status === "requested" && r.env === "staging") || r.status === "go"),
        canRollback: canOperate && r.status === "deployed",
        canGo: ["PM", "Admin", "SuperAdmin"].includes(role) && r.env === "production" && r.status === "requested",
        history: (r.history || [])
          .slice()
          .reverse()
          .map((x, i) => ({
            key: i,
            date: fmt(x.date),
            actor: x.actor,
            text: HISTORY_TEXT[x.to] || x.to,
            note: x.note || "",
            color: x.to === "rolled_back" ? "danger" : x.to === "deployed" || x.to === "go" ? "green" : "ink",
          })),
      };
    };

    const rels = (data.releases || []).slice().sort((a, b) => (b.requestedOn + b.id).localeCompare(a.requestedOn + a.id));
    return {
      isDevOps,
      queue: rels.filter((r) => ["requested", "go"].includes(r.status)).map(mapRel),
      history: rels.filter((r) => ["deployed", "rolled_back"].includes(r.status)).map(mapRel),
      counts: {
        queue: rels.filter((r) => r.status === "requested" && r.env === "staging").length,
        prodPending: rels.filter((r) => r.env === "production" && ["requested", "go"].includes(r.status)).length,
        deployed: rels.filter((r) => r.status === "deployed").length,
        rolledBack: rels.filter((r) => r.status === "rolled_back").length,
      },
      canRequestProd: ["PC", "PM", "Admin", "SuperAdmin"].includes(role),
      prodOpts: data.projects.filter((p) => p.stage >= 5 && p.stage < COMPLETED_STAGE).map((p) => ({ value: p.id, label: p.client })),
    };
  }, [data, role, top]);
}
