import { useState, useMemo } from "react";
import { Select, Modal } from "antd";
import { CrEmailToggle, CrNextButton } from "../../components/cards/CrActions";
import ChipGroup from "../../components/common/ChipGroup";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useProjectFilter } from "../../utils/helpers/useProjectFilter";
import { useDispatch, useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { modalOpened } from "../../redux/slices/uiSlice";
import { roleTrack, taskTrack } from "../../utils/domain/tasks";
import { mapCr } from "../../utils/domain/views";
import { useData, useStrict } from "../../app/useCrm";

const TAB_OPTIONS = [
  { value: "change", label: "Change Request" },
  { value: "client", label: "Client Request" },
];

/** Change request register & Client request manager. */
export default function ChangeRequests() {
  const [activeTab, setActiveTab] = useState("change");
  const [selectedClientReq, setSelectedClientReq] = useState(null);

  const dispatch = useDispatch();
  const data = useData();
  const role = useSelector(selectRole);
  const strict = useStrict();
  const { filter, setFilter, options, matches, selectedProjectId } = useProjectFilter(data.projects);

  const projectDropdownOptions = useMemo(() => {
    return options.map((o) => ({
      value: o.value,
      label: o.value === "all" ? "All projects" : o.label,
    }));
  }, [options]);

  const rows = useMemo(() => {
    const track = roleTrack(role);
    return data.crs.filter((c) => matches(c) && (!track || taskTrack(c) === track)).map((c) => mapCr(c, data, strict));
  }, [data, role, strict, matches]);

  const clientRequests = useMemo(() => {
    const list = [];
    data.crs.forEach((c) => {
      if (!matches(c)) return;
      const p = data.projects.find((proj) => proj.id === c.projectId);
      list.push({
        id: `REQ-${c.id}`,
        title: c.title,
        project: p ? p.client : "Unknown",
        projectId: c.projectId,
        date: c.raised,
        channel: "Client Portal",
        spoc: p ? p.salesOwner : "Client SPOC",
        type: c.kind,
        cost: c.cost,
        timeline: c.timeline,
        status: c.status === "Approved" ? "Approved" : c.status === "Quoted" ? "Quoted" : "Pending Review",
        statusTone: c.status === "Approved" ? "green" : c.status === "Quoted" ? "lime" : "white",
        detail: c.detail || `${c.cost} · ${c.timeline}`,
      });
    });

    (data.communications || []).forEach((comm) => {
      const p = data.projects.find((proj) => proj.id === comm.projectId);
      if (!p || !matches(p)) return;
      list.push({
        id: `COMM-${comm.id}`,
        title: comm.message,
        project: p.client,
        projectId: p.id,
        date: comm.date,
        channel: comm.channel || "WhatsApp",
        spoc: comm.recipient || "Client",
        type: comm.type || "Client Ask",
        cost: "Pending estimate",
        timeline: "TBD",
        status: "Pending Review",
        statusTone: "paper",
        detail: `Via ${comm.channel} on ${comm.date}`,
      });
    });

    return list;
  }, [data, matches]);

  return (
    <div className="page">
      <div className="row row--wrap row--between items-center gap-12">
        <ChipGroup options={TAB_OPTIONS} value={activeTab} onChange={setActiveTab} />
        
        <div className="row row--center gap-12 items-center">
          <div className="row row--center gap-6 items-center">
            <span className="fw-700 text-ink fs-12 uppercase font-mono">Project</span>
            <Select
              value={filter}
              onChange={setFilter}
              options={projectDropdownOptions}
              style={{ minWidth: 190 }}
              className="brand-select"
            />
          </div>
          <PillButton
            size="sm"
            tone="ink"
            className="btn-shadow-green"
            onClick={() => dispatch(modalOpened({ kind: "cr", extra: { projectId: selectedProjectId } }))}
          >
            + Change request
          </PillButton>
        </div>
      </div>

      {activeTab === "change" && (
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
      )}

      {activeTab === "client" && (
        <div className="grid-table cr-table">
          <div className="grid-table__scroll">
            <div className="grid-table__head cr-table__grid">
              <span>REQ ID</span>
              <span>Client Request</span>
              <span>Project</span>
              <span>Channel · Contact</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {clientRequests.length === 0 && (
              <div className="cr-table__empty text-muted">No client requests for this filter.</div>
            )}
            {clientRequests.map((req) => (
              <div
                key={req.id}
                className="grid-table__row cr-table__grid cr-table__row tone-white cursor-pointer"
                onClick={() => setSelectedClientReq(req)}
              >
                <span className="font-mono fs-11 text-ink">{req.id}</span>
                <div>
                  <div className="fw-600 text-ink">{req.title}</div>
                  <div className="meta">{req.type} · raised {req.date}</div>
                </div>
                <span>{req.project}</span>
                <span className="fs-12">{req.channel} · {req.spoc}</span>
                <Pill tone={req.statusTone} className="justify-self-start">{req.status}</Pill>
                <PillButton
                  size="xs"
                  tone="ink"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClientReq(req);
                  }}
                >
                  View Details →
                </PillButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedClientReq && (
        <Modal
          open={!!selectedClientReq}
          onCancel={() => setSelectedClientReq(null)}
          footer={null}
          width={560}
          centered
          rootClassName="brand-modal"
          classNames={{ mask: "brand-mask brand-mask--dark" }}
        >
          <div className="stack gap-16">
            <div className="row row--between items-center">
              <div>
                <div className="overlay-title">
                  {selectedClientReq.id} Details<span className="text-brand">.</span>
                </div>
                <div className="fs-12 text-muted">Client Request Overview</div>
              </div>
              <Pill tone={selectedClientReq.statusTone} bold>{selectedClientReq.status}</Pill>
            </div>

            <Card className="stack gap-10 tone-paper">
              <div className="kv">
                <span>Project</span>
                <strong className="text-ink">{selectedClientReq.project}</strong>
                <span>Contact / SPOC</span>
                <span>{selectedClientReq.spoc}</span>
                <span>Date Raised</span>
                <span>{selectedClientReq.date}</span>
                <span>Channel</span>
                <span>{selectedClientReq.channel}</span>
                <span>Request Type</span>
                <span>{selectedClientReq.type}</span>
              </div>

              <div className="border-top pt-8 mt-4">
                <div className="label-caps mb-4">Request Description</div>
                <div className="fs-13 text-ink fw-600">{selectedClientReq.title}</div>
                <div className="meta mt-4">{selectedClientReq.detail}</div>
              </div>
            </Card>

            <div className="row row--end gap-8">
              <PillButton
                size="sm"
                tone="lime"
                onClick={() => {
                  dispatch(
                    modalOpened({
                      kind: "cr",
                      extra: { projectId: selectedClientReq.projectId, title: selectedClientReq.title },
                    })
                  );
                  setSelectedClientReq(null);
                }}
              >
                + Convert to Change Request
              </PillButton>
              <PillButton size="sm" onClick={() => setSelectedClientReq(null)}>
                Close
              </PillButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

