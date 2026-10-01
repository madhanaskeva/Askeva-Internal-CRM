import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import ChipGroup from "../../components/common/ChipGroup";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import StatCard from "../../components/common/StatCard";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { fmt } from "../../utils/helpers/date";
import { useAction, useData } from "../../app/useCrm";
import { toggleCommunicationCourt } from "../../utils/entities/communicationUtils";

export default function Communication() {
  const dispatch = useDispatch();
  const run = useAction();
  const data = useData();
  const [filter, setFilter] = useState("all");

  const filters = useMemo(() => [{ value: "all", label: "All" }, ...data.projects.map((p) => ({ value: p.id, label: p.client }))], [data.projects]);

  const { list, stats } = useMemo(() => {
    const raw = (data.clientCommunications || []).filter((c) => filter === "all" || c.projectId === filter);
    const P = (id) => data.projects.find((p) => p.id === id) || {};
    const list = raw
      .slice()
      .reverse()
      .map((c) => {
        const p = P(c.projectId);
        const onClient = c.court === "client";
        return {
          ...c,
          project: p.client || "—",
          code: p.code || "—",
          time: c.time || "11:00",
          date: fmt(c.date),
          courtLabel: onClient ? "Waiting on client" : "Action on Askeva",
          status: onClient ? "Client Action" : "Us Action",
          statusTone: onClient ? "rose" : "lime",
          onClient,
        };
      });
    const stats = [
      { key: "total", label: "Total Logged", value: raw.length, sub: "Communications across projects", tone: "ink800" },
      { key: "wa", label: "WhatsApp", value: raw.filter((c) => c.channel === "WhatsApp").length, sub: "Group & direct messages", tone: "white" },
      { key: "email", label: "Email", value: raw.filter((c) => c.channel === "Email").length, sub: "Approvals & MoMs", tone: "white" },
      { key: "calls", label: "Calls / Meetings", value: raw.filter((c) => ["Call", "Meeting"].includes(c.channel)).length, sub: "Daily call notes", tone: "lime" },
    ];
    return { list, stats };
  }, [data, filter]);

  const toggleCourt = (id) => run(toggleCommunicationCourt, { communicationId: id });

  return (
    <div className="page">
      <div className="row row--between row--wrap gap-12">
        <ChipGroup label="Filter project:" options={filters} value={filter} onChange={setFilter} />
        <PillButton tone="lime" size="sm" shadow onClick={() => dispatch(modalOpened({ kind: "communication" }))}>
          + New Client Communication
        </PillButton>
      </div>

      <div className="grid-auto min-170 grid-gap-14">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} />
        ))}
      </div>

      <Card flush>
        <div className="comm-head row row--between row--wrap gap-12">
          <div className="comm-head__title">Client Communication Log</div>
          <div className="comm-head__meta">Daily call MoM · WhatsApp updates · Email approvals · Formal communications</div>
        </div>
        <div className="stack comm-list">
          {list.map((c) => (
            <div key={c.id} className="comm-item stack">
              <div className="row row--between row--top row--wrap gap-12">
                <div className="row row--wrap">
                  <Pill tone="ink" bold>{c.channel}</Pill>
                  <strong className="fs-13 text-ink">{c.recipient}</strong>
                  <span className="mono-meta">{c.code} · {c.project}</span>
                </div>
                <div className="row">
                  <span className="mono-meta comm-item__when">{c.date} {c.time}</span>
                  <Pill size="xs" tone={c.statusTone} className={c.onClient ? "text-danger" : undefined}>{c.status}</Pill>
                </div>
              </div>
              <div className="comm-item__msg">
                <strong className="text-green">[{c.type}]</strong> {c.message}
              </div>
              <div className="row row--between row--wrap gap-12 meta">
                <span>
                  Logged by PM / PC · Action required: <strong>{c.courtLabel}</strong>
                </span>
                <PillButton tone="white" size="xxs" className="comm-item__toggle" onClick={() => toggleCourt(c.id)}>
                  Toggle Action (Us ↔ Client)
                </PillButton>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
