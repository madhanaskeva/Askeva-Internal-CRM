import { useMemo } from "react";
import Card from "../../components/common/Card";
import DataTable from "../../components/tables/DataTable";
import { ROLE_LABEL } from "../../constants/crm";
import { useSelector } from "react-redux";
import { selectFullData } from "../../redux/selectors";
import { fmt } from "../../utils/date";

/** Label → text colour key (overrides/removals red, rule changes/additions green). */
const logColor = (label) =>
  /OVERRIDE|Removed|Deactivated|ROLLBACK/i.test(label) ? "danger" : /Rule|Added|Assigned/i.test(label) ? "green" : "ink";

const COLUMNS = [
  {
    title: "When",
    key: "when",
    width: 110,
    render: (_, l) => <span className="mono-meta nowrap">{l.date} {l.time}</span>,
  },
  {
    title: "Who",
    key: "actor",
    width: 170,
    render: (_, l) => (
      <span className="fw-700 text-ink nowrap">
        {l.actor} <span className="syslog__role">· {l.role}</span>
      </span>
    ),
  },
  { title: "View", dataIndex: "view", key: "view", width: 110, render: (v) => <span className="mono-meta">{v}</span> },
  { title: "Action", dataIndex: "label", key: "label", render: (v, l) => <span className={`syslog__label text-${l.color}`}>{v}</span> },
];

export default function SystemLog() {
  const full = useSelector(selectFullData);

  const rows = useMemo(
    () =>
      (full.syslog || [])
        .slice()
        .reverse()
        .slice(0, 150)
        .map((l, i) => ({
          key: `${l.ts}-${i}`,
          time: new Date(l.ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          date: fmt(l.date),
          actor: l.actor,
          role: ROLE_LABEL[l.role] || l.role,
          view: l.view,
          label: l.label,
          color: logColor(l.label),
        })),
    [full.syslog],
  );

  return (
    <div className="page">
      <Card className="stack gap-12">
        <div className="row row--between row--wrap row--baseline">
          <span className="section-title__text">System log</span>
          <span className="meta">Every write to the record, by any role · newest first · last 150</span>
        </div>
        <DataTable columns={COLUMNS} dataSource={rows} rowKey="key" pageSize={25} flat emptyText="No writes logged yet." />
      </Card>
    </div>
  );
}
