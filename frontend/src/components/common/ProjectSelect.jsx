import { Select } from "antd";
import { useMemo } from "react";

/**
 * Searchable project picker — scales to any number of projects (unlike a chip row).
 * Each option shows client, project code and an optional per-project count.
 * @param {Array} projects
 * @param {string} value          "all" or a project id
 * @param {Object<string,number>} counts  projectId → count shown on the right (e.g. open tasks)
 * @param {string} countLabel     label for the count, e.g. "open"
 */
export default function ProjectSelect({ projects, value, onChange, counts = {}, countLabel = "", className }) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const options = useMemo(
    () => [
      { value: "all", label: "All projects", code: `${projects.length} projects`, count: total },
      ...projects
        .slice()
        .sort((a, b) => a.client.localeCompare(b.client))
        .map((p) => ({ value: p.id, label: p.client, code: p.code || "", count: counts[p.id] || 0 })),
    ],
    [projects, counts, total],
  );

  return (
    <div className={`project-select ${className || ""}`}>
      <span className="project-select__label">Project</span>
      <Select
        className="brand-input project-select__control"
        value={value}
        onChange={onChange}
        options={options}
        showSearch
        optionFilterProp="label"
        filterOption={(input, o) => `${o.label} ${o.code}`.toLowerCase().includes(input.toLowerCase())}
        popupMatchSelectWidth={320}
        listHeight={320}
        optionRender={(o) => (
          <div className="project-select__opt">
            <span className="project-select__name">{o.data.label}</span>
            <span className="project-select__code">{o.data.code}</span>
            {countLabel && <span className="project-select__count">{o.data.count} {countLabel}</span>}
          </div>
        )}
      />
    </div>
  );
}
