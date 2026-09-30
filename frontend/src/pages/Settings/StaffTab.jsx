import { App, Select } from "antd";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import DataTable from "../../components/tables/DataTable";
import { useDispatch } from "react-redux";
import { crmActions } from "../../redux/slices/crmSlice";
import { modalOpened } from "../../redux/slices/uiSlice";
import { removeStaff, toggleStaff } from "../../utils/actions/adminActions";
import { withCtx } from "../../utils/actions/context";
import { fmt } from "../../utils/date";

const LEADS = ["Admin", "Project Manager", "Project Coordinator"];

/** Staff & roles: full staff register with reporting line, status and admin actions. */
export default function StaffTab({ staff, isSuper }) {
  const dispatch = useDispatch();
  const { modal } = App.useApp();

  const rows = staff
    .slice()
    .sort((a, b) => LEADS.indexOf(b.role) - LEADS.indexOf(a.role) || a.name.localeCompare(b.name))
    .map((s) => ({
      ...s,
      locked: s.role === "Admin" && !isSuper,
      reportOpts: [
        { value: "", label: "— none —" },
        ...staff.filter((x) => x.id !== s.id && LEADS.includes(x.role)).map((x) => ({ value: x.id, label: x.name + " · " + x.role })),
      ],
    }));

  const confirmRemove = (s) =>
    modal.confirm({
      title: `Remove ${s.name}?`,
      content: "This deletes the staff record. Deactivate instead if the person may return.",
      okText: "Remove",
      okButtonProps: { className: "btn-pill tone-danger" },
      cancelButtonProps: { className: "btn-pill tone-white" },
      onOk: () => removeStaff(s.id),
    });

  const columns = [
    { title: "Name", key: "name", render: (_, s) => (<><strong className="text-ink">{s.name}</strong><div className="mono-meta">{s.idNo || "—"}</div></>) },
    { title: "Role", key: "role", render: (_, s) => (<>{s.role}{s.locked && <div className="fs-10 text-muted">Super admin only</div>}</>) },
    { title: "Dept", dataIndex: "dept", key: "dept", render: (v) => v || "—" },
    { title: "Contact", key: "contact", render: (_, s) => (<span className="fs-11">{s.email || "—"}<div className="text-muted">{s.phone || "—"}</div></span>) },
    {
      title: "Reports to",
      key: "reports",
      render: (_, s) => (
        <Select
          size="small"
          className="brand-input set-select"
          value={s.reportsTo || ""}
          disabled={s.locked}
          options={s.reportOpts}
          popupMatchSelectWidth={false}
          onChange={(v) => withCtx(crmActions.reportsToSet, { staffId: s.id, to: v })}
        />
      ),
    },
    { title: "Joined", key: "joined", render: (_, s) => <span className="font-mono fs-10">{fmt(s.joined)}</span> },
    { title: "Status", key: "status", render: (_, s) => <Pill size="xs" tone={s.status === "Active" ? "green" : "white"}>{s.status}</Pill> },
    {
      title: "",
      key: "actions",
      render: (_, s) => (
        <div className="stack gap-4">
          {s.locked && <span className="fs-10 text-muted">locked</span>}
          <div className="row row--wrap gap-4">
            <PillButton size="xxs" onClick={() => dispatch(modalOpened({ kind: "staffFull", extra: { staff: s } }))}>Edit</PillButton>
            <PillButton size="xxs" className="tone-paper-btn" onClick={() => toggleStaff(s.id)}>{s.status === "Active" ? "Deactivate" : "Reactivate"}</PillButton>
            <PillButton size="xxs" dangerText onClick={() => confirmRemove(s)}>Remove</PillButton>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card flush>
      <div className="card-head">
        <span className="section-title__text">Staff &amp; roles</span>
        <PillButton size="xxs" tone="lime" className="set-shadow-btn" onClick={() => dispatch(modalOpened({ kind: "staffFull", extra: {} }))}>
          + Add staff member
        </PillButton>
      </div>
      <DataTable columns={columns} dataSource={rows} flat className="card-table" />
      <div className="card-foot">
        Remove is refused while open tasks or projects still point to the person — deactivate instead. Admins can only be created, edited or removed by the Super admin.
      </div>
    </Card>
  );
}
