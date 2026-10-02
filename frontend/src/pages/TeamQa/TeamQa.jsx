import { Select } from "antd";
import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import DataTable from "../../components/tables/DataTable";
import { activeTesters, buildQaAnalytics, perTesterRows, qaWindow } from "../../utils/domain/qa";
import QaAnalytics from "../QaWorkspace/components/QaAnalytics";
import { BUG_SEVERITIES, QA_PERIODS } from "../../data";
import { useData, useFullData } from "../../app/useCrm";

const num = (title, key) => ({ title, key, align: "right", render: (_, r) => <span className="num-cell">{r[key]}</span> });

const emptyFilters = { tester: null, project: null, severity: null };

/** Team QA (managers): per-tester table + filterable QA analytics for the whole team or one tester. */
export default function TeamQa() {
  const data = useData();
  const full = useFullData();
  const [period, setPeriod] = useState("today");
  const [filters, setFilters] = useState(emptyFilters);
  const [focus, setFocus] = useState(null);

  const testers = useMemo(() => activeTesters(full), [full]);
  const opts = useMemo(
    () => ({ project: filters.project, severity: filters.severity }),
    [filters]
  );
  const qa = useMemo(
    () => buildQaAnalytics(data, testers, filters.tester, period, opts, focus),
    [data, testers, filters.tester, period, opts, focus]
  );
  const perTester = useMemo(
    () => perTesterRows(data, testers, period, opts),
    [data, testers, period, opts]
  );

  const setFilter = (key) => (value) => {
    setFilters((prev) => ({ ...prev, [key]: value || null }));
    setFocus(null);
  };

  const P = (id) => data.projects.find((p) => p.id === id) || {};
  const scope =
    (filters.tester || "QA team") +
    (filters.project ? " · " + P(filters.project).client : "") +
    (filters.severity ? " · " + filters.severity : "");

  const critical = qa.stats.raisedList.filter((b) => b.severity === "Critical").length;
  const high = qa.stats.raisedList.filter((b) => b.severity === "High").length;

  const selects = [
    ["tester", [{ value: "", label: "All testers" }, ...testers.map((t) => ({ value: t, label: t }))]],
    ["project", [{ value: "", label: "All projects" }, ...data.projects.map((p) => ({ value: p.id, label: p.client }))]],
    ["severity", [{ value: "", label: "All severities" }, ...BUG_SEVERITIES.map((s) => ({ value: s, label: s }))]],
  ];

  const testerCols = [
    {
      title: "Tester",
      key: "name",
      render: (_, t) => (
        <button type="button" className="link-block fw-700 text-ink" onClick={() => setFilter("tester")(filters.tester === t.name ? null : t.name)}>
          {t.name}
        </button>
      ),
    },
    num("Tested", "tested"),
    num("Passed", "passed"),
    num("Failed", "failed"),
    num("Bugs raised", "raised"),
    num("Retests", "retested"),
    num("Verified", "verified"),
    num("Reopened", "reopened"),
    num("Not a bug", "notABug"),
    num("Pending", "pending"),
  ];

  return (
    <div className="page">
      <div className="row row--between row--wrap gap-8 items-center mb-12">
        <div className="row row--wrap gap-6 items-center">
          {selects.map(([key, options]) => (
            <Select
              key={key}
              size="small"
              className="brand-input qa-filter"
              value={filters[key] || ""}
              options={options}
              onChange={setFilter(key)}
              popupMatchSelectWidth={false}
              style={{ minWidth: 130 }}
            />
          ))}
        </div>
        <div className="row row--wrap gap-6 items-center ml-auto">
          <span className="font-mono fs-11 text-muted mr-4">{qaWindow(period).label}</span>
          <ChipGroup options={QA_PERIODS} value={period} onChange={setPeriod} />
        </div>
      </div>

      <Card flush>
        <div className="card-head">
          <span className="section-title__text">Testers</span>
          <span className="meta">{scope} · {critical} critical · {high} high raised</span>
        </div>
        <DataTable
          columns={testerCols}
          dataSource={perTester}
          rowKey="name"
          flat
          className="card-table"
          rowClassName={(t) => (filters.tester === t.name ? "row-selected" : "")}
        />
        <div className="card-foot">Click a tester to scope every panel below to them · drill-down: Tester → Project → Task → Bug → Event.</div>
      </Card>

      <QaAnalytics qa={qa} onFocus={setFocus} showDev={false} />
    </div>
  );
}
