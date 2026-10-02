import { Button, Input, Select } from "antd";
import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import EmptyState from "../../components/common/EmptyState";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useDispatch, useSelector } from "react-redux";
import { selectSession } from "../../redux/selectors";
import { clientProjectSelected } from "../../redux/slices/sessionSlice";
import { modalOpened, toastShown } from "../../redux/slices/uiSlice";
import { cx } from "../../utils/helpers/classNames";
import { buildClientPortal } from "../../utils/domain/clientPortal";
import { useAction, useData, useHealthMap } from "../../app/useCrm";
import { approveClientGate, commentMilestone, markClientInputs } from "../../utils/entities/projectUtils";
import { decideChangeRequestByClient } from "../../utils/entities/changeRequestUtils";

const Title = ({ children, className }) => <div className={cx("section-title__text", className)}>{children}</div>;

/** Client SPOC portal: progress, approvals, CR quotations, pending items, milestones, releases. */
export default function ClientPortal() {
  const dispatch = useDispatch();
  const run = useAction();
  const data = useData();
  const H = useHealthMap();
  const { clientProject } = useSelector(selectSession);
  const [drafts, setDrafts] = useState({});

  const cp = data.projects.find((p) => p.id === clientProject) || data.projects[0];
  const c = useMemo(() => (cp ? buildClientPortal(data, cp, H[cp.id]) : null), [data, cp, H]);
  if (!c) return <div className="page"><EmptyState>No project available.</EmptyState></div>;

  const approveGate = (a) => run(approveClientGate, { projectId: c.id, stage: a.stage, key: a.key, label: a.label, spoc: c.spoc });
  const decideCr = (crId, approve) => {
    run(decideChangeRequestByClient, { crId, approve });
    dispatch(toastShown(approve ? "Change request accepted by the client." : "Change request rejected by the client."));
  };
  const send = (m) => {
    const text = (drafts[m.id] || "").trim();
    if (!text) return;
    run(commentMilestone, { projectId: c.id, index: m.index, text, by: c.spoc });
    setDrafts((d) => ({ ...d, [m.id]: "" }));
  };

  return (
    <div className="page">
      <div className="row row--between row--wrap gap-12">
        <div className="row row--baseline row--wrap gap-10">
          <span className="font-display text-ink cp-project">{c.project}</span>
          <span className="mono-meta">{c.code} · signed in as {c.spoc}</span>
        </div>
        <Select
          className="brand-input cp-picker"
          value={c.id}
          options={data.projects.map((p) => ({ value: p.id, label: p.client }))}
          onChange={(v) => dispatch(clientProjectSelected(v))}
          popupMatchSelectWidth={false}
        />
      </div>

      <Card tone="ink800" className="stack gap-10">
        <div className="row row--between row--wrap gap-12">
          <div>
            <div className="label-caps text-lime">Current stage</div>
            <div className="font-display cp-big">{c.stage}</div>
          </div>
          <div className="cp-target">
            <div className="label-caps text-lime">Target completion</div>
            <div className="font-display cp-big">{c.deadline}</div>
            <div className="fs-11 text-meta">{c.leftLabel}</div>
          </div>
        </div>
        <div className="row row--wrap gap-4">
          {c.stages.map((s) => (
            <span key={s.key} className={cx("cp-stage", `tone-${s.tone}`)}>{s.num} · {s.label}</span>
          ))}
        </div>
      </Card>

      <div className="grid-auto min-280 cp-grid">
        <Card tone="lime" className="stack gap-8 cp-card">
          <div className="row row--between row--wrap gap-8 items-center">
            <Title>Your approvals needed</Title>
            <PillButton
              size="xs"
              tone="ink"
              onClick={() => dispatch(modalOpened({ kind: "cr", extra: { projectId: c.id } }))}
            >
              Request a change
            </PillButton>
          </div>
          {c.approvals.map((a) => (
            <div key={a.key} className="cp-box row row--between gap-8">
              <span className="text-ink fw-600">{a.label}</span>
              <PillButton size="xs" tone="green" onClick={() => approveGate(a)}>Approve</PillButton>
            </div>
          ))}
          {c.crs.map((cr) => (
            <div key={cr.id} className="cp-box stack gap-6">
              <div className="row row--between gap-8">
                <span className="mono-meta">{cr.id} · {cr.kind}</span>
                <Pill size="xs" tone={cr.tone}>{cr.status}</Pill>
              </div>
              <div className="text-ink fw-600">{cr.title}</div>
              <div className="meta">Quotation {cr.cost} · timeline {cr.timeline}</div>
              {cr.isQuoted && (
                <div className="row gap-6">
                  <PillButton size="xs" tone="green" onClick={() => decideCr(cr.id, true)}>Approve</PillButton>
                  <PillButton size="xs" onClick={() => decideCr(cr.id, false)}>Reject</PillButton>
                </div>
              )}
            </div>
          ))}
          {c.inputs && (
            <div className="cp-box row row--between gap-8 fs-12">
              <span className="text-ink">{c.inputs.label}</span>
              {c.inputs.done ? (
                <span className="text-green fw-700">✓</span>
              ) : (
                <PillButton size="xs" tone="ink" onClick={() => run(markClientInputs, { projectId: c.id, spoc: c.spoc })}>
                  Mark uploaded
                </PillButton>
              )}
            </div>
          )}
        </Card>

        <Card className="stack gap-8 cp-card">
          <Title>Pending from your side</Title>
          {c.pending.map((f) => (
            <div key={f.id} className="cp-line">
              <span className="text-ink">{f.title}</span>
              <span className={`font-mono fs-10 nowrap text-${f.color}`}>{f.type} · {f.due}</span>
            </div>
          ))}
          <Title className="mt-8">Testing &amp; demo</Title>
          <div className="fs-12-5">{c.testing}</div>
          <Title className="mt-8">Handover</Title>
          <div className="fs-12-5">{c.handover}</div>
          <Title className="mt-8">Invoices</Title>
          {c.invoices.map((i) => (
            <div key={i.id} className="cp-invoice">
              <span className="text-ink">{i.label} <span className="fs-10 text-muted">· {i.date}</span></span>
              <span className="num-cell">{i.amount}</span>
              <Pill size="xs" tone={i.tone}>{i.status}</Pill>
            </div>
          ))}
        </Card>
      </div>

      <Card className="stack gap-8 cp-card">
        <Title>Milestones</Title>
        {c.milestones.map((m) => (
          <div key={m.id} className="cp-ms">
            <span className={cx("cp-ms__dot", m.done ? "tone-green" : "tone-white")} />
            <div>
              <strong className="text-ink">{m.id} · {m.name}</strong> <span className="text-muted">· target {m.target}</span>
            </div>
            <span className={`fs-11 fw-600 text-${m.color}`}>{m.status}</span>
            <div className="cp-ms__thread stack gap-4">
              {m.comments.map((cm) => (
                <div key={cm.key} className="fs-11 text-body">
                  <span className="mono-meta">{cm.date} · {cm.by}</span> · {cm.text}
                </div>
              ))}
              <div className="row gap-6">
                <Input
                  size="small"
                  className="brand-input input-pill tone-paper"
                  value={drafts[m.id] || ""}
                  placeholder="Comment on this milestone…"
                  onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                  onPressEnter={() => send(m)}
                />
                <Button size="small" className="btn-pill btn-xs tone-lime" onClick={() => send(m)}>Send</Button>
              </div>
            </div>
          </div>
        ))}
      </Card>

      {c.releases.length > 0 && (
        <Card className="stack gap-8 cp-card">
          <Title>Releases</Title>
          {c.releases.map((r) => (
            <div key={r.id} className="cp-release">
              <Pill size="xs" tone={r.envTone}>{r.env}</Pill>
              <strong>{r.version}</strong>
              <span className="text-body">{r.notes}</span>
              <span className={`fw-600 ml-auto text-${r.color}`}>{r.status}</span>
              <span className="mono-meta">{r.url}</span>
            </div>
          ))}
        </Card>
      )}

      {c.log.length > 0 && (
        <div className="fs-11 text-muted">
          {c.log.map((l) => (
            <div key={l.key}>{l.date} · {l.text}</div>
          ))}
        </div>
      )}
    </div>
  );
}
