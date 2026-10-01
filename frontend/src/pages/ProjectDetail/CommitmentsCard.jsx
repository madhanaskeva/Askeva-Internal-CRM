import Card from "../../components/common/Card";
import { useAction } from "../../app/useCrm";
import { addRedesign } from "../../utils/entities/projectUtils";

/** Client & commitments: SPOC, escalation matrix, commercials, UI redesign counter. */
export default function CommitmentsCard({ p }) {
  const run = useAction();
  const over = p.redesigns > 2;
  const redesignNote = over ? "Over the 2-round limit — PM + client discussion required" : `${2 - Math.min(p.redesigns, 2)} round(s) left within standard timeline`;

  return (
    <Card className="stack gap-10 pd-card">
      <div className="label-caps fw-700 text-ink">Client &amp; commitments</div>
      <div className="kv pd-kv">
        <span>SPOC</span>
        <strong className="text-ink">{p.spoc}</strong>
        <span>Escalation</span>
        <span>L1 PC ↔ SPOC · L2 PM ↔ {p.clientManager} · L3 Mgmt ↔ {p.clientOwner}</span>
        <span>Cost</span>
        <strong className="text-ink">{p.cost}</strong>
        <span>Payments</span>
        <span>{p.payments}</span>
        <span>Server</span>
        <span>{p.server}</span>
        <span>Daily call</span>
        <span>{p.callTime}</span>
      </div>
      <div className="row row--between gap-10 pd-redesign">
        <div>
          <div className="label-caps text-muted">UI redesign rounds</div>
          <div className={`fs-11 ${over ? "text-danger" : "text-ink"}`}>{redesignNote}</div>
        </div>
        <div className="row gap-8">
          <span className={`font-display pd-redesign__count ${over ? "text-danger" : "text-ink"}`}>{p.redesigns}</span>
          <button type="button" className="pd-round-btn" title="Add redesign round" onClick={() => run(addRedesign, { projectId: p.id })}>
            +
          </button>
        </div>
      </div>
    </Card>
  );
}
