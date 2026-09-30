import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../constants/routes";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { wPct } from "../../utils/pct";
import MilestoneList from "./MilestoneList";
import RevisionList from "./RevisionList";

/** One project on the Deadlines page. `r` is a buildDeadlineRow() view-model. */
export default function DeadlineCard({ r }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const requestRevision = () => dispatch(modalOpened({ kind: "revise", extra: { projectId: r.id, to: r.deadlineIso } }));

  return (
    <Card className="stack dl-card">
      <div className="row row--wrap row--between row--top gap-12">
        <button type="button" className="link-block" onClick={() => navigate(pathFor("detail", { projectId: r.id }))}>
          <div className="mono-meta">
            {r.code} · {r.billing} billing
          </div>
          <div className="font-display text-ink dl-card__client">{r.client}</div>
        </button>
        <div className="row row--wrap gap-8">
          <Pill size="md" bold tone={r.statusTone}>{r.status}</Pill>
          <PillButton size="xs" tone="white" onClick={requestRevision}>
            Request deadline revision
          </PillButton>
          <span className={`font-display dl-card__left text-${r.leftColor}`}>{r.leftLabel}</span>
        </div>
      </div>

      <div className="grid-auto min-200 dl-card__grid">
        <div>
          <div className="row row--between dl-bar-label">
            <span>Time elapsed</span>
            <span>{r.elapsed}%</span>
          </div>
          <ProgressBar pct={r.elapsed} height={8} className="dl-bar" />
          <div className="row row--between dl-bar-label">
            <span>Milestones done</span>
            <span>{r.done}%</span>
          </div>
          <ProgressBar pct={r.done} height={8} fill="gradient" className="dl-bar" />
          <div className={`fw-600 text-${r.varianceColor}`}>
            {r.varianceLabel} · {r.slipLabel}
          </div>
        </div>

        <div className="stack gap-4">
          <div className="text-ink fw-600">{r.nextLabel}</div>
          <div className="text-muted">
            Baseline {r.baseline} · current {r.deadline} → effective {r.effective}
          </div>
          {r.hasRev && <div className="text-danger fw-600">{r.revLabel}</div>}
          {r.hasExt && <div className="text-green">{r.extLabel}</div>}
          <RevisionList projectId={r.id} revisions={r.revisions} />
          {r.hasUi && (
            <>
              <div className={`mt-4 fw-600 text-${r.uiColor}`}>{r.uiLabel}</div>
              <div className="bar">
                <div className={`bar__fill dl-fill--${r.uiColor} ${wPct(r.uiPct)}`} />
              </div>
            </>
          )}
        </div>
      </div>

      <MilestoneList row={r} variant="tiles" />
    </Card>
  );
}
