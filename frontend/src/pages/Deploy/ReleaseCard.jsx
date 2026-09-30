import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useDispatch } from "react-redux";
import { taskOpened } from "../../redux/slices/uiSlice";
import { approveRelease, goRelease, rollbackRelease } from "../../utils/actions/releaseActions";

/** One release (queue or history) with tasks, production gates, actions and history. */
export default function ReleaseCard({ r, onDeploy }) {
  const dispatch = useDispatch();

  return (
    <Card className="stack gap-10">
      <div className="row row--between row--wrap">
        <div className="row row--wrap">
          <Pill size="xs" tone={r.envTone}>{r.envLabel}</Pill>
          <span className="dep-rel__version">{r.version}</span>
          <span className="mono-meta">{r.id} · {r.tag} · {r.project}</span>
        </div>
        <Pill size="xs" tone={r.statusTone}>{r.statusLabel}</Pill>
      </div>

      <div className="fs-12-5 text-ink">{r.notes}</div>

      <div className="row row--wrap gap-12 meta">
        <span>
          Requested by <strong className="text-ink">{r.requestedBy}</strong> · {r.requestedOn}
        </span>
        <span className="font-mono dep-rel__url">{r.url}</span>
      </div>

      {r.tasks.length > 0 && (
        <div className="stack gap-4">
          <div className="label-caps text-muted">Release notes · tasks included</div>
          {r.tasks.map((t) => (
            <button key={t.id} type="button" className="dep-task" onClick={() => dispatch(taskOpened(t.id))}>
              <Pill size="xs" tone={t.tone}>{t.status}</Pill>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      )}

      {r.gates.length > 0 && (
        <div className="dep-gates stack gap-4">
          <div className="label-caps fw-700 text-ink">Production gates</div>
          {r.gates.map((g) => (
            <div key={g.label} className="row fs-12 dep-gate">
              <span className={`dep-gate__mark ${g.ok ? "tone-green" : "tone-rose text-danger"}`}>{g.ok ? "✓" : "✕"}</span>
              <span className="flex-1">{g.label}</span>
              {g.canApprove && (
                <PillButton size="xxs" onClick={() => approveRelease(r.id, g.who)}>
                  Record approval
                </PillButton>
              )}
            </div>
          ))}
        </div>
      )}

      {r.isDeployed && <div className="dep-rel__state text-green">Deployed · {r.deployedLabel}</div>}
      {r.isRolledBack && <div className="dep-rel__state text-danger">Rolled back · was {r.deployedLabel}</div>}

      {(r.canGo || r.canDeploy || r.canRollback) && (
        <div className="row row--wrap gap-6">
          {r.canGo && (
            <PillButton tone="ink" size="sm" onClick={() => goRelease(r.id, r.gates)}>
              PM · GO for production
            </PillButton>
          )}
          {r.canDeploy && (
            <PillButton tone="green" size="sm" className="dep-btn-shadow" onClick={() => onDeploy(r.id)}>
              Deploy to {r.env}
            </PillButton>
          )}
          {r.canRollback && (
            <PillButton size="sm" dangerText onClick={() => rollbackRelease(r.id)}>
              Roll back (reason in note)
            </PillButton>
          )}
        </div>
      )}

      <details className="dep-history">
        <summary>History</summary>
        <div className="stack gap-4 dep-history__list">
          {r.history.map((x) => (
            <div key={x.key} className="dep-history__row">
              <span className="mono-meta">{x.date}</span>
              <span className={`fw-700 text-${x.color}`}>
                {x.text} · {x.actor}
              </span>
              <span>{x.note}</span>
            </div>
          ))}
        </div>
      </details>
    </Card>
  );
}
