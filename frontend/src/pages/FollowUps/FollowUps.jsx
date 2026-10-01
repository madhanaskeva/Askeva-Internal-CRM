import { useMemo, useState } from "react";
import { Select } from "antd";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FollowupItem from "../../components/cards/FollowupItem";
import PillButton from "../../components/common/PillButton";
import { useProjectFilter } from "../../utils/helpers/useProjectFilter";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { TODAY, daysBetween } from "../../utils/helpers/date";
import { mapFollowup } from "../../utils/domain/views";
import { useData } from "../../app/useCrm";

/** [label, predicate, tone] — the follow-up swim lanes (Upcoming removed per request). */
const GROUPS = [
  ["Overdue", (f) => f.status === "pending" && daysBetween(f.due, TODAY) < 0, "rose"],
  ["Today", (f) => f.status === "pending" && daysBetween(f.due, TODAY) === 0, "lime"],
  ["Done", (f) => f.status === "done", "ink800"],
];

const PAGE_SIZE = 4;

export default function FollowUps() {
  const dispatch = useDispatch();
  const data = useData();
  const { filter, setFilter, options, matches, selectedProjectId } = useProjectFilter(data.projects);
  const [pages, setPages] = useState({ Overdue: 0, Today: 0, Done: 0 });

  const projectDropdownOptions = useMemo(() => {
    return options.map((o) => ({
      value: o.value,
      label: o.value === "all" ? "All projects" : o.label,
    }));
  }, [options]);

  const groups = useMemo(() => {
    const list = data.followups.filter(matches);
    return GROUPS.map(([label, fn, tone]) => ({
      label,
      tone,
      items: list.filter(fn).sort((a, b) => a.due.localeCompare(b.due)).map((f) => mapFollowup(f, data)),
    }));
  }, [data, matches]);

  const handleFilterChange = (val) => {
    setFilter(val);
    setPages({ Overdue: 0, Today: 0, Done: 0 });
  };

  return (
    <div className="page">
      <div className="row row--wrap row--between items-center gap-12">
        <div className="row row--center gap-6 items-center">
          <span className="fw-700 text-ink fs-12 uppercase font-mono">Project</span>
          <Select
            value={filter}
            onChange={handleFilterChange}
            options={projectDropdownOptions}
            style={{ minWidth: 190 }}
            className="brand-select"
          />
        </div>
        <PillButton
          size="sm"
          tone="ink"
          className="btn-shadow-green"
          onClick={() => dispatch(modalOpened({ kind: "followup", extra: { projectId: selectedProjectId } }))}
        >
          + Follow-up
        </PillButton>
      </div>

      <div className="grid-auto min-260 fu-groups">
        {groups.map((g) => {
          const laneKey = g.label;
          const totalPages = Math.ceil(g.items.length / PAGE_SIZE);
          const maxPage = Math.max(0, totalPages - 1);
          const safePage = Math.min(pages[laneKey] || 0, maxPage);
          const visibleItems = g.items.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

          return (
            <div key={g.label} className={`board-col tone-${g.tone} fu-group`}>
              <div className="board-col__head">
                <span className="board-col__title">{g.label}</span>
                <div className="row gap-6 items-center">
                  {totalPages > 1 && (
                    <div className="row gap-4 items-center">
                      <button
                        type="button"
                        className="fu-arrow-btn"
                        disabled={safePage === 0}
                        onClick={() => setPages((prev) => ({ ...prev, [laneKey]: Math.max(0, safePage - 1) }))}
                        title="Previous (Reverse)"
                      >
                        <ChevronLeft size={12} strokeWidth={2.5} />
                      </button>
                      <span className="font-mono fs-10 text-muted">
                        {safePage + 1}/{totalPages}
                      </span>
                      <button
                        type="button"
                        className="fu-arrow-btn"
                        disabled={safePage >= maxPage}
                        onClick={() => setPages((prev) => ({ ...prev, [laneKey]: Math.min(maxPage, safePage + 1) }))}
                        title="Next (Forward)"
                      >
                        <ChevronRight size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                  <span className="board-col__count">{g.items.length}</span>
                </div>
              </div>

              <div className="stack gap-8">
                {visibleItems.map((f) => (
                  <FollowupItem key={f.id} followup={f} variant="board" />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="row row--between items-center fu-col-footer mt-6">
                  <span className="fs-10 text-muted font-mono">
                    Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, g.items.length)} of {g.items.length}
                  </span>
                  <div className="row gap-4 items-center">
                    <button
                      type="button"
                      className="fu-arrow-btn"
                      disabled={safePage === 0}
                      onClick={() => setPages((prev) => ({ ...prev, [laneKey]: Math.max(0, safePage - 1) }))}
                      title="Previous (Reverse)"
                    >
                      <ChevronLeft size={13} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      className="fu-arrow-btn"
                      disabled={safePage >= maxPage}
                      onClick={() => setPages((prev) => ({ ...prev, [laneKey]: Math.min(maxPage, safePage + 1) }))}
                      title="Next (Forward)"
                    >
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

