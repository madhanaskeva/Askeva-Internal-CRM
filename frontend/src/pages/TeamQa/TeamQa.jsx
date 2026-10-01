import { Select } from "antd";
import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import PillButton from "../../components/common/PillButton";
import DataTable from "../../components/tables/DataTable";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { activeTesters, buildQaAnalytics, perTesterRows, qaDevelopers, qaWindow } from "../../utils/domain/qa";
import QaAnalytics from "../QaWorkspace/components/QaAnalytics";
import QaSearchBar from "../QaWorkspace/components/QaSearchBar";
import { useQaSearch } from "../QaWorkspace/useQaSearch";
import { BUG_SEVERITIES, QA_PERIODS } from "../../data";
import { useData, useFullData } from "../../app/useCrm";

const num = (title, key) => ({ title, key, align: "right", render: (_, r) => <span className="num-cell">{r[key]}</span> });

/** Team QA (managers): per-tester table + filterable QA analytics for the whole team or one tester. */
export default function TeamQa() {
  const navigate = useNavigate();
  const data = useData();
  const full = useFullData();
  const [period, setPeriod] = useState("today");
  const [filters, setFilters] = useState({ tester: null, project: null, developer: null, severity: null });
  const [focus, setFocus] = useState(null);
  // The original shows the search bar here too; like the original it only filters the tester queue view.
  const search = useQaSearch();

  const testers = useMemo(() => activeTesters(full), [full]);
  const opts = useMemo(() => ({ project: filters.project, developer: filters.developer, severity: filters.severity }), [filters]);
  const qa = useMemo(() => buildQaAnalytics(data, testers, filters.tester, period, opts, focus), [data, testers, filters.tester, period, opts, focus]);
  const perTester = useMemo(() => perTesterRows(data, testers, period, opts), [data, testers, period, opts]);

  const setFilter = (key) => (value) => {
    setFilters((f) => ({ ...f, [key]: value || null }));
    setFocus(null);
  };
  const P = (id) => data.projects.find((p) => p.id === id) || {};
  const scope = (filters.tester || "QA team") + (filters.project ? " · " + P(filters.project).client : "") + (filters.developer ? " · dev " + filters.developer : "") + (filters.severity ? " · " + filters.severity : "");
  const critical = qa.stats.raisedList.filter((b) => b.severity === "Critical").length;
  const high = qa.stats.raisedList.filter((b) => b.severity === "High").length;

  const selects = [
    ["tester", [{ value: "", label: "All testers" }, ...testers.map((t) => ({ value: t, label: t }))]],
    ["project", [{ value: "", label: "All projects" }, ...data.projects.map((p) => ({ value: p.id, label: p.client }))]],
    ["developer", [{ value: "", label: "All developers" }, ...qaDevelopers(data).map((d) => ({ value: d, label: d }))]],
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
    {
      title: "",
      key: "full",
      render: (_, t) => (
        <PillButton
          size="xxs"
          onClick={() => navigate(pathFor("team") + `?person=${encodeURIComponent(t.name)}&range=${period === "today" ? "today" : period === "week" ? "week" : "all"}`)}
        >
          View full activity →
        </PillButton>
      ),
    },
  ];

  return (
    <div className="page">
      <QaSearchBar {...search.barProps} />

      <div className="row row--between row--wrap gap-8">
        <div className="row row--wrap gap-6">
          {selects.map(([key, options]) => (
            <Select
              key={key}
              size="small"
              className="brand-input qa-filter"
              value={filters[key] || ""}
              options={options}
              onChange={setFilter(key)}
              popupMatchSelectWidth={false}
            />
          ))}
        </div>
        <div className="row row--wrap gap-6">
          <span className="font-mono fs-11 text-ink">{qaWindow(period).label}</span>
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

      <QaAnalytics qa={qa} onFocus={setFocus} />
    </div>
  );
}
