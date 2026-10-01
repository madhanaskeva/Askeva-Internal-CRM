import { Select, Input } from "antd";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import PillButton from "../../components/common/PillButton";
import DataTable from "../../components/tables/DataTable";
import { activeTesters, buildQaAnalytics, perTesterRows, qaWindow } from "../../utils/domain/qa";
import QaAnalytics from "../QaWorkspace/components/QaAnalytics";
import { BUG_SEVERITIES, QA_PERIODS } from "../../data";
import { useData, useFullData } from "../../app/useCrm";

const num = (title, key) => ({ title, key, align: "right", render: (_, r) => <span className="num-cell">{r[key]}</span> });

const emptyFilters = { tester: null, project: null, severity: null, search: "" };

/** Team QA (managers): per-tester table + filterable QA analytics for the whole team or one tester. */
export default function TeamQa() {
  const data = useData();
  const full = useFullData();
  const [period, setPeriod] = useState("today");
  const [filters, setFilters] = useState(emptyFilters);
  const [draftFilters, setDraftFilters] = useState(emptyFilters);
  const [focus, setFocus] = useState(null);

  const testers = useMemo(() => activeTesters(full), [full]);
  const opts = useMemo(
    () => ({ project: filters.project, severity: filters.severity, search: filters.search }),
    [filters]
  );
  const qa = useMemo(
    () => buildQaAnalytics(data, testers, filters.tester, period, opts, focus),
    [data, testers, filters.tester, period, opts, focus]
  );
  const perTesterUnfiltered = useMemo(
    () => perTesterRows(data, testers, period, opts),
    [data, testers, period, opts]
  );

  const perTester = useMemo(() => {
    if (!filters.search) return perTesterUnfiltered;
    const q = filters.search.toLowerCase();
    return perTesterUnfiltered.filter((t) => t.name.toLowerCase().includes(q));
  }, [perTesterUnfiltered, filters.search]);

  const setFilter = (key) => (value) => {
    const updated = { ...draftFilters, [key]: value || null };
    setDraftFilters(updated);
    setFilters(updated);
    setFocus(null);
  };

  const handleSearch = () => {
    setFilters(draftFilters);
    setFocus(null);
  };

  const handleClear = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setFocus(null);
  };

  const P = (id) => data.projects.find((p) => p.id === id) || {};
  const scope =
    (filters.tester || "QA team") +
    (filters.project ? " · " + P(filters.project).client : "") +
    (filters.severity ? " · " + filters.severity : "") +
    (filters.search ? ` · search: "${filters.search}"` : "");

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
      <div className="row row--between row--wrap gap-8 items-center">
        <div className="row row--wrap gap-6 items-center">
          {selects.map(([key, options]) => (
            <Select
              key={key}
              size="small"
              className="brand-input qa-filter"
              value={draftFilters[key] || ""}
              options={options}
              onChange={setFilter(key)}
              popupMatchSelectWidth={false}
            />
          ))}
          <Input
            size="small"
            placeholder="Search QA..."
            value={draftFilters.search || ""}
            onChange={(e) => setDraftFilters((f) => ({ ...f, search: e.target.value }))}
            onPressEnter={handleSearch}
            style={{ width: 150 }}
            className="brand-input"
            prefix={<Search size={13} className="text-muted" />}
          />
          <PillButton size="xs" tone="lime" onClick={handleSearch}>
            Search
          </PillButton>
          <PillButton size="xs" onClick={handleClear}>
            Clear
          </PillButton>
        </div>
        <div className="row row--wrap gap-6 items-center">
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

      <QaAnalytics qa={qa} onFocus={setFocus} showDev={false} />
    </div>
  );
}
