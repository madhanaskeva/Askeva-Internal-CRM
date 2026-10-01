import { useMemo } from "react";
import { CrEmailToggle, CrNextButton } from "../../components/cards/CrActions";
import ChipGroup from "../../components/common/ChipGroup";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { CR_STEPS } from "../../data";
import { useProjectFilter } from "../../utils/helpers/useProjectFilter";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { modalOpened } from "../../redux/slices/uiSlice";
import { roleTrack, taskTrack } from "../../utils/domain/tasks";
import { mapCr } from "../../utils/domain/views";
import { useData, useStrict } from "../../app/useCrm";

/** Change request register (SOP §8): Raised → Documented → Estimated → Quoted → Approved. */
export default function ChangeRequests() {
  const dispatch = useDispatch();
  const data = useData();
  const role = useSelector(selectRole);
  const strict = useStrict();
  const { filter, setFilter, options, matches, selectedProjectId } = useProjectFilter(data.projects);

  const rows = useMemo(() => {
    const track = roleTrack(role);
    return data.crs.filter((c) => matches(c) && (!track || taskTrack(c) === track)).map((c) => mapCr(c, data, strict));
  }, [data, role, strict, matches]);

  return (
    <div className="page">
      <div className="row row--wrap gap-8">
        <ChipGroup label="Project" options={options} value={filter} onChange={setFilter} />
        <PillButton size="sm" tone="ink" className="ml-auto btn-shadow-green" onClick={() => dispatch(modalOpened({ kind: "cr", extra: { projectId: selectedProjectId } }))}>
          + Change request
        </PillButton>
      </div>

      <div className="row row--wrap gap-6">
        <span className="chip-group__label cr-flow__label">SOP §8 flow</span>
        {CR_STEPS.map((label, i) => (
          <Pill key={label} size="md" tone="white">
            {String(i + 1).padStart(2, "0")} · {label}
          </Pill>
        ))}
      </div>

      <div className="grid-table cr-table">
        <div className="grid-table__scroll">
          <div className="grid-table__head cr-table__grid">
            <span>CR</span>
            <span>Request</span>
            <span>Project</span>
            <span>Cost · Timeline</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {rows.length === 0 && <div className="cr-table__empty text-muted">No change requests for this filter.</div>}
          {rows.map((c) => (
            <div key={c.id} className={`grid-table__row cr-table__grid cr-table__row tone-${c.rowTone}`}>
              <span className="font-mono fs-11 text-ink">{c.id}</span>
              <div>
                <div className="fw-600 text-ink">{c.title}</div>
                <div className="meta">
                  {c.kind} · raised {c.raised}
                  {c.daysOn > 0 && <span className="text-ink fw-600"> · {c.daysLabel}</span>}
                  {c.overridden && <span className="text-danger fw-700"> · approved without email (override)</span>}
                </div>
              </div>
              <span>{c.project}</span>
              <span className="font-mono fs-11">{c.detail}</span>
              <Pill tone={c.statusTone} className="justify-self-start">{c.status}</Pill>
              <CrNextButton cr={c} />
              {c.needsEmail && <CrEmailToggle cr={c} label="Client email confirmation received — required before Approved" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
