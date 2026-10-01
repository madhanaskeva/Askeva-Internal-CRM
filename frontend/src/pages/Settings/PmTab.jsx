import { Select } from "antd";
import Card from "../../components/common/Card";
import DataTable from "../../components/tables/DataTable";
import { STAGES } from "../../data";
import { useAction } from "../../app/useCrm";
import { assignPm } from "../../utils/entities/projectUtils";

/** Project → PM assignment (each PM sees only their assigned projects). */
export default function PmTab({ projects, pms }) {
  const run = useAction();
  const opts = [{ value: "", label: "— unassigned —" }, ...pms.map((x) => ({ value: x.id, label: x.name }))];

  const columns = [
    { title: "Project", key: "project", render: (_, p) => (<><strong className="text-ink">{p.client}</strong> <span className="mono-meta">{p.code}</span></>) },
    { title: "Stage", key: "stage", render: (_, p) => STAGES[p.stage] },
    {
      title: "Project manager",
      key: "pm",
      render: (_, p) => (
        <Select
          size="small"
          className="brand-input set-select"
          value={p.pmId || ""}
          options={opts}
          popupMatchSelectWidth={false}
          onChange={(v) => run(assignPm, { projectId: p.id, pmId: v })}
        />
      ),
    },
  ];

  return (
    <Card flush>
      <div className="card-head">
        <span className="section-title__text">Project → PM assignment</span>
      </div>
      <DataTable columns={columns} dataSource={projects} flat className="card-table" />
      <div className="card-foot">Each PM sees only the projects assigned here. Admin and Super admin see everything.</div>
    </Card>
  );
}
