import { useMemo, useState } from "react";
import StatCard from "../../components/common/StatCard";
import EmptyState from "../../components/common/EmptyState";
import PillButton from "../../components/common/PillButton";
import FinanceProjectCard from "./FinanceProjectCard";
import FinanceSearchBar from "./FinanceSearchBar";
import { useFinance } from "./useFinance";

export default function Finance() {
  const { stats, finRows } = useFinance();

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchText, setSearchText] = useState("");

  const handleClear = () => {
    setSelectedFilter("all");
    setSearchText("");
  };

  const filteredRows = useMemo(() => {
    let rows = finRows;

    if (selectedFilter && selectedFilter !== "all") {
      const [cat, val] = selectedFilter.split(":");

      if (cat === "project" && val !== "all") {
        rows = rows.filter((r) => r.id === val);
      } else if (cat === "invoice") {
        if (val === "overdue") {
          rows = rows.filter((r) => r.invoices.some((i) => i.status.toLowerCase() === "overdue"));
        } else if (val === "due") {
          rows = rows.filter((r) => r.invoices.some((i) => i.status.toLowerCase() === "due"));
        } else if (val === "received") {
          rows = rows.filter((r) => r.invoices.some((i) => i.status.toLowerCase() === "received"));
        } else if (val === "has_invoice") {
          rows = rows.filter((r) => r.invoices.length > 0);
        }
      } else if (cat === "logdays") {
        if (val === "over_budget") {
          rows = rows.filter((r) => r.effortRows.some((e) => e.over) || r.isOverrun);
        } else if (val === "has_effort") {
          rows = rows.filter((r) => r.effortRows.some((e) => e.pct > 0));
        } else if (["ui", "backend", "tester", "pc"].includes(val)) {
          rows = rows.filter((r) => r.effortRows.some((e) => e.key === val && e.name !== "TBD"));
        }
      } else if (cat === "expense") {
        if (val === "has_expense") {
          rows = rows.filter((r) => r.expenseRows.length > 0);
        } else if (val !== "all") {
          rows = rows.filter((r) =>
            r.expenseRows.some((x) => x.category.toLowerCase().includes(val.toLowerCase()))
          );
        }
      }
    }

    const q = searchText.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((r) => {
      const inProject =
        r.client.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.stage.toLowerCase().includes(q) ||
        r.billing.toLowerCase().includes(q);

      const inInvoices = r.invoices.some(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.status.toLowerCase().includes(q) ||
          i.amount.toLowerCase().includes(q)
      );

      const inEffort = r.effortRows.some(
        (e) =>
          e.role.toLowerCase().includes(q) ||
          e.name.toLowerCase().includes(q) ||
          e.label.toLowerCase().includes(q)
      );

      const inExpenses = r.expenseRows.some(
        (x) =>
          x.desc.toLowerCase().includes(q) ||
          x.category.toLowerCase().includes(q) ||
          x.amount.toLowerCase().includes(q)
      );

      return inProject || inInvoices || inEffort || inExpenses;
    });
  }, [finRows, selectedFilter, searchText]);

  return (
    <div className="page">
      <div className="grid-auto min-200 grid-gap-14">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} size="md" />
        ))}
      </div>

      <FinanceSearchBar
        finRows={finRows}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        searchText={searchText}
        onSearchChange={setSearchText}
        onClear={handleClear}
      />

      <div className="stack gap-16">
        {filteredRows.length > 0 ? (
          filteredRows.map((r) => (
            <FinanceProjectCard key={r.id} row={r} activeFilter={selectedFilter} />
          ))
        ) : (
          <div className="card stack gap-8 p-16 items-center text-center">
            <EmptyState>No finance records match the selected filter criteria.</EmptyState>
            <PillButton size="xs" onClick={handleClear}>
              Reset filters
            </PillButton>
          </div>
        )}
      </div>
    </div>
  );
}
