import { useMemo } from "react";
import FollowupItem from "../../components/cards/FollowupItem";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import PillButton from "../../components/common/PillButton";
import { useProjectFilter } from "./useProjectFilter";
import { useDispatch, useSelector } from "react-redux";
import { selectData } from "../../redux/selectors";
import { modalOpened } from "../../redux/slices/uiSlice";
import { TODAY, daysBetween } from "../../utils/date";
import { mapFollowup } from "../../utils/domain/views";

/** [label, predicate, tone] — the four follow-up swim lanes. */
const GROUPS = [
  ["Overdue", (f) => f.status === "pending" && daysBetween(f.due, TODAY) < 0, "rose"],
  ["Today", (f) => f.status === "pending" && daysBetween(f.due, TODAY) === 0, "lime"],
  ["Upcoming", (f) => f.status === "pending" && daysBetween(f.due, TODAY) > 0, "white"],
  ["Done", (f) => f.status === "done", "ink800"],
];

export default function FollowUps() {
  const dispatch = useDispatch();
  const data = useSelector(selectData);
  const { filter, setFilter, options, matches, selectedProjectId } = useProjectFilter();

  const { groups, awaitingUs, awaitingClient } = useMemo(() => {
    const pending = data.followups.filter((f) => f.status === "pending");
    const list = data.followups.filter(matches);
    return {
      awaitingUs: pending.filter((f) => (f.court || "us") === "us" && daysBetween(f.due, TODAY) <= 0).length,
      awaitingClient: pending.filter((f) => (f.court || "us") === "client").length,
      groups: GROUPS.map(([label, fn, tone]) => ({
        label,
        tone,
        items: list.filter(fn).sort((a, b) => a.due.localeCompare(b.due)).map((f) => mapFollowup(f, data)),
      })),
    };
  }, [data, matches]);

  return (
    <div className="page">
      <div className="row row--wrap gap-8">
        <ChipGroup label="Project" options={options} value={filter} onChange={setFilter} />
        <PillButton size="sm" tone="ink" className="ml-auto btn-shadow-green" onClick={() => dispatch(modalOpened({ kind: "followup", extra: { projectId: selectedProjectId } }))}>
          + Follow-up
        </PillButton>
      </div>

      <Card className="fu-cadence">
        <span className="label-caps fw-700 text-ink">SOP cadence</span>
        <span className="fw-700 text-danger">{awaitingUs} awaiting our response</span>
        <span className="fw-700 text-ink">{awaitingClient} waiting on client</span>
        <span>Daily client call → MoM in WhatsApp group within 1 hour</span>
        <span>Daily internal team call</span>
        <span>Daily WhatsApp progress update</span>
        <strong className="fu-cadence__rule">WhatsApp = updates · Email = approvals</strong>
      </Card>

      <div className="grid-auto min-260 fu-groups">
        {groups.map((g) => (
          <div key={g.label} className={`board-col tone-${g.tone} fu-group`}>
            <div className="board-col__head">
              <span className="board-col__title">{g.label}</span>
              <span className="board-col__count">{g.items.length}</span>
            </div>
            {g.items.map((f) => (
              <FollowupItem key={f.id} followup={f} variant="board" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
