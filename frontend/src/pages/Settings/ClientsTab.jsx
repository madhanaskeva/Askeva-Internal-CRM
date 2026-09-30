import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import DataTable from "../../components/tables/DataTable";
import { crmActions } from "../../redux/slices/crmSlice";
import { withCtx } from "../../utils/actions/context";
import { fmt } from "../../utils/date";

/** Client SPOC portal accounts — suspend / reactivate. */
export default function ClientsTab({ accounts, projects }) {
  const P = (id) => projects.find((p) => p.id === id) || {};

  const columns = [
    { title: "SPOC", key: "name", render: (_, c) => <strong className="text-ink">{c.name}</strong> },
    { title: "Project", key: "project", render: (_, c) => (<>{P(c.projectId).client || "—"} <span className="mono-meta">{P(c.projectId).code || ""}</span></>) },
    { title: "Email · phone", key: "contact", render: (_, c) => (<span className="fs-11">{c.email}<div className="text-muted">{c.phone || "—"}</div></span>) },
    { title: "Last login", key: "login", render: (_, c) => <span className="font-mono fs-10">{fmt(c.lastLogin)}</span> },
    { title: "Status", key: "status", render: (_, c) => <Pill size="xs" tone={c.status === "Active" ? "green" : "danger"}>{c.status}</Pill> },
    {
      title: "",
      key: "toggle",
      render: (_, c) => (
        <PillButton size="xxs" onClick={() => withCtx(crmActions.clientAccountToggled, { accountId: c.id })}>
          {c.status === "Active" ? "Suspend" : "Reactivate"}
        </PillButton>
      ),
    },
  ];

  return (
    <Card flush>
      <div className="card-head">
        <span className="section-title__text">Client accounts · SPOC logins</span>
      </div>
      <DataTable columns={columns} dataSource={accounts} flat className="card-table" />
      <div className="card-foot">
        Portal access only — clients see milestones, approvals, CRs, releases and invoices for their own project. Authentication is out of scope for this prototype.
      </div>
    </Card>
  );
}
