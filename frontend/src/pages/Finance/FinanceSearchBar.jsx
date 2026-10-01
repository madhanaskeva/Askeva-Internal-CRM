import { useMemo } from "react";
import { Input, Select } from "antd";
import { Search, Filter, X } from "lucide-react";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";

export default function FinanceSearchBar({
  finRows,
  selectedFilter,
  onFilterChange,
  searchText,
  onSearchChange,
  onClear,
}) {
  const groupedOptions = useMemo(() => {
    return [
      {
        label: "📁 Projects",
        options: [
          { value: "project:all", label: "All Projects" },
          ...finRows.map((r) => ({
            value: `project:${r.id}`,
            label: `${r.client} (${r.code})`,
          })),
        ],
      },
      {
        label: "🧾 Invoices & Payments",
        options: [
          { value: "invoice:all", label: "All Invoices & Payments" },
          { value: "invoice:overdue", label: "Overdue Invoices" },
          { value: "invoice:due", label: "Due Invoices" },
          { value: "invoice:received", label: "Received Invoices" },
          { value: "invoice:has_invoice", label: "With Invoices" },
        ],
      },
      {
        label: "⏱️ Staff Effort & Cost (Log Days)",
        options: [
          { value: "logdays:all", label: "All Staff Effort & Log Days" },
          { value: "logdays:over_budget", label: "Over Effort Plan / Overrun" },
          { value: "logdays:has_effort", label: "With Logged Days" },
          { value: "logdays:ui", label: "UI / Frontend Effort" },
          { value: "logdays:backend", label: "Backend Effort" },
          { value: "logdays:tester", label: "Manual Tester Effort" },
          { value: "logdays:pc", label: "Project Coordinator Effort" },
        ],
      },
      {
        label: "💸 Expenses",
        options: [
          { value: "expense:all", label: "All Expenses" },
          { value: "expense:has_expense", label: "With Expenses" },
          { value: "expense:server", label: "Server / Hosting" },
          { value: "expense:domain", label: "Domain / SSL" },
          { value: "expense:api", label: "Third-party API" },
        ],
      },
    ];
  }, [finRows]);

  // Find active label for display tag
  const activeLabel = useMemo(() => {
    if (!selectedFilter || selectedFilter === "all") return null;
    for (const group of groupedOptions) {
      const found = group.options.find((opt) => opt.value === selectedFilter);
      if (found) return `${group.label.replace(/^[^a-zA-Z0-9]+/, "")}: ${found.label}`;
    }
    return null;
  }, [selectedFilter, groupedOptions]);

  const hasActiveFilters = (selectedFilter && selectedFilter !== "all") || !!searchText;

  return (
    <Card className="fin-search-card">
      <div className="fin-search-bar-wrap">
        <div className="fin-search-select-box">
          <label className="fin-search-label">
            <Filter size={13} className="text-muted mr-1" />
            Category & Filter
          </label>
          <Select
            className="brand-input fin-category-select"
            value={selectedFilter || "all"}
            options={groupedOptions}
            onChange={onFilterChange}
            showSearch
            placeholder="Click to filter by Projects, Invoices, Log days, Expenses..."
            popupMatchSelectWidth={false}
            dropdownStyle={{ minWidth: 320 }}
          />
        </div>

        <div className="fin-search-input-box">
          <label className="fin-search-label">
            <Search size={13} className="text-muted mr-1" />
            Keyword Search
          </label>
          <Input
            className="brand-input input-pill tone-paper fin-text-input"
            prefix={<Search size={14} className="text-muted mr-1" />}
            value={searchText}
            placeholder="Search client, invoice, role, expense..."
            onChange={(e) => onSearchChange(e.target.value)}
            allowClear
          />
        </div>

        {hasActiveFilters && (
          <div className="fin-search-clear-box">
            <PillButton className="fin-btn-clear" onClick={onClear}>
              <X size={12} className="mr-1" /> Clear
            </PillButton>
          </div>
        )}
      </div>

      {activeLabel && (
        <div className="fin-active-filter-bar mt-8">
          <span className="fs-11 text-muted mr-6">Active filter:</span>
          <span className="fin-filter-badge">
            {activeLabel}
            <button
              type="button"
              className="fin-badge-close"
              onClick={() => onFilterChange("all")}
              title="Remove filter"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </Card>
  );
}
