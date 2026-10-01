import Card from "../../components/common/Card";
import { cx } from "../../utils/helpers/classNames";
import { STRUCTURE_DEPTH_TONES } from "../../data";

/** Flatten the active reporting tree (depth-first) — port of the original `tree`. */
function buildTree(staff, projects) {
  const kids = (id) => staff.filter((s) => (s.reportsTo || null) === id && s.status === "Active");
  const flat = [];
  const walk = (s, depth) => {
    flat.push({
      id: s.id,
      name: s.name,
      role: s.role,
      depth: Math.min(depth, 4),
      tone: STRUCTURE_DEPTH_TONES[Math.min(depth, 3)],
      projects: s.role === "Project Manager" ? projects.filter((p) => p.pmId === s.id).map((p) => p.code).join(", ") || "no projects" : "",
    });
    kids(s.id).forEach((c) => walk(c, depth + 1));
  };
  staff.filter((s) => !s.reportsTo && s.status === "Active").forEach((r) => walk(r, 0));
  return flat;
}

/** Team structure tree + clients under each PM. */
export default function StructureTab({ staff, projects }) {
  const tree = buildTree(staff, projects);
  const pmName = (id) => (staff.find((s) => s.id === id) || {}).name || "unassigned";

  return (
    <div className="grid-auto min-320 set-structure">
      <Card className="stack gap-6 set-card">
        <div className="section-title__text">Team structure</div>
        <div className="meta mb-4">
          Admin → Project Manager → Project Coordinator → Front-end · Back-end · Tester · DevOps. Change a line under Staff &amp; roles → Reports to.
        </div>
        {tree.map((n) => (
          <div key={n.id} className={cx("set-tree-node", `set-tree-node--d${n.depth}`, `tone-${n.tone}`)}>
            <span>
              <strong>{n.name}</strong> <span className="fs-10 op-85">· {n.role}</span>
            </span>
            <span className="font-mono fs-10 op-85">{n.projects}</span>
          </div>
        ))}
      </Card>
      <Card className="stack gap-6 set-card">
        <div className="section-title__text">Clients under each PM</div>
        {projects.map((p) => (
          <div key={p.id} className="set-client-row">
            <span>
              <strong>{p.client}</strong> <span className="mono-meta">{p.code}</span> · SPOC {p.spoc}
            </span>
            <span className="text-green fw-600">PM · {pmName(p.pmId)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
