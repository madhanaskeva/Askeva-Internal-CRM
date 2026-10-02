import { useMemo, useState } from "react";
import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { Calendar, Briefcase, Folder } from "lucide-react";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { cx } from "../../utils/helpers/classNames";
import { TODAY } from "../../utils/helpers/date";
import { auditRows } from "../../utils/domain/audit";
import { teamPeople } from "../../utils/domain/team";
import { useData, useMe } from "../../app/useCrm";

const Col = ({ title, titleClass = "text-muted", children, last }) => (
  <div className={cx("audit-col", last && "audit-col--last")}>
    <div className={`audit-col__title ${titleClass}`}>{title}</div>
    {children}
  </div>
);

/** Daily audit — Date, Role & Project filters with instant real-time updates. */
export default function DailyAudit() {
  const navigate = useNavigate();
  const data = useData();
  const userRole = useSelector(selectRole);
  const me = useMe();

  const [date, setDate] = useState(TODAY);
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const peopleList = useMemo(() => teamPeople(data), [data]);
  const roleOptions = useMemo(() => Array.from(new Set(peopleList.map((p) => p.role))).filter(Boolean), [peopleList]);
  const projectOptions = useMemo(() => (data.projects || []).map((p) => ({ value: p.id, label: p.client || p.name })), [data]);

  const rows = useMemo(
    () => auditRows(data, peopleList, date, date, userRole, me),
    [data, peopleList, date, userRole, me]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((a) => {
      const matchesRole = roleFilter === "all" || a.role === roleFilter;
      const matchesProject =
        projectFilter === "all" ||
        (data.tasks || []).some(
          (t) =>
            t.projectId === projectFilter &&
            (t.assignee === a.person ||
              (t.history || []).some(
                (h) => h.actor === a.person && h.date === date
              ))
        );
      return matchesRole && matchesProject;
    });
  }, [rows, roleFilter, projectFilter, data, date]);

  return (
    <div className="page">
      {/* Filter Card */}
      <Card className="mb-16 pd-card" style={{ padding: "16px 20px" }}>
        <div className="grid-auto min-200 gap-16">
          {/* Date */}
          <div>
            <label className="row gap-6 items-center fs-11 fw-700 text-ink mb-6">
              <Calendar size={13} className="text-muted" /> Date
            </label>
            <DatePicker
              value={date ? dayjs(date) : null}
              onChange={(d) => setDate(d ? d.format("YYYY-MM-DD") : TODAY)}
              format="DD-MM-YYYY"
              allowClear={false}
              className="w-full brand-input"
              style={{ borderRadius: "8px" }}
            />
          </div>

          {/* Role */}
          <div>
            <label className="row gap-6 items-center fs-11 fw-700 text-ink mb-6">
              <Briefcase size={13} className="text-muted" /> Role
            </label>
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              className="w-full brand-select"
              style={{ borderRadius: "8px" }}
              options={[
                { value: "all", label: "All roles" },
                ...roleOptions.map((r) => ({ value: r, label: r })),
              ]}
            />
          </div>

          {/* Project */}
          <div>
            <label className="row gap-6 items-center fs-11 fw-700 text-ink mb-6">
              <Folder size={13} className="text-muted" /> Project
            </label>
            <Select
              value={projectFilter}
              onChange={setProjectFilter}
              className="w-full brand-select"
              style={{ borderRadius: "8px" }}
              options={[
                { value: "all", label: "All projects" },
                ...projectOptions,
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Tabular Audit Cards */}
      <div className="stack gap-12">
        {filteredRows.map((a) => (
          <Card key={a.key} flush>
            <div className="audit-head">
              <div className="row row--baseline row--wrap gap-10">
                <span className="font-display text-ink audit-person">{a.person}</span>
                <span className="mono-meta">{a.role}</span>
              </div>
              <div className="row row--wrap gap-8 items-center">
                {a.hours ? <span className="fs-11 fw-600 text-ink">{a.hours} h logged</span> : null}
                {a.canOpenDetail && (
                  <PillButton size="xxs" onClick={() => navigate(pathFor("team") + `?person=${encodeURIComponent(a.person)}`)}>Full record →</PillButton>
                )}
              </div>
            </div>
            <div className="audit-summary">{a.summary}</div>
            <div className="grid-auto min-200 audit-cols">
              <Col title="Assigned">
                {a.assigned.map((x, i) => <div key={i} className="audit-line text-ink">· {x}</div>)}
              </Col>
              <Col title="Completed · evidence" titleClass="text-green">
                {a.completed.map((x, i) => (
                  <div key={i} className="audit-line text-ink">✓ {x.title} <span className="text-muted">— {x.verified}</span></div>
                ))}
                {a.bugsFixed.map((x, i) => <div key={"f" + i} className="audit-line text-ink">✓ fixed {x}</div>)}
                {a.bugsRaised.map((x, i) => <div key={"r" + i} className="audit-line text-ink">✓ raised {x}</div>)}
                {a.tests > 0 && <div className="audit-line text-ink">✓ {a.tests} test action(s)</div>}
              </Col>
              <Col title="Pending">
                {a.pending.map((x, i) => <div key={i} className="audit-line text-body">· {x}</div>)}
              </Col>
              <Col title="Allocation">
                {a.alloc.map((x, i) => (
                  <div key={i} className="audit-line text-ink">· {x.text} <span className="text-muted">— {x.task}</span></div>
                ))}
                <div className="fs-10 text-muted mt-4">{a.allocMeta}</div>
              </Col>
              <Col title="Blocked" titleClass="text-danger" last>
                {a.blocked.map((x, i) => <div key={i} className="audit-line text-danger">✕ {x.task} — {x.note}</div>)}
              </Col>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
