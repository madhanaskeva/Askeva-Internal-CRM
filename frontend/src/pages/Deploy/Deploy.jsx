import { Input, Select } from "antd";
import { useState } from "react";
import Card from "../../components/common/Card";
import { useDispatch, useSelector } from "react-redux";
import { actionNoteChanged } from "../../redux/slices/uiSlice";
import { deployRelease, requestProduction } from "../../utils/actions/releaseActions";
import CountCard from "../../components/cards/CountCard";
import ReleaseCard from "./ReleaseCard";
import { useDeploy } from "./useDeploy";
import { SMOKE_OPTIONS } from "../../data";
import { useAction } from "../../app/useCrm";

export default function Deploy() {
  const dispatch = useDispatch();
  const run = useAction();
  const note = useSelector((s) => s.ui.actionNote);
  const { isDevOps, queue, history, counts, canRequestProd, prodOpts } = useDeploy();
  const [smoke, setSmoke] = useState("Passed");
  const [downtime, setDowntime] = useState("");

  const deploy = (id) => {
    if (run(deployRelease, id, { smoke, downtime }).ok) {
      setSmoke("Passed");
      setDowntime("");
    }
  };

  return (
    <div className="page">
      <div className="grid-auto dep-counts">
        <CountCard label="Staging requests" value={counts.queue} tone="lime" />
        <CountCard label="Production pending" value={counts.prodPending} tone="ink800" labelColor="lime" />
        <CountCard label="Deployed" value={counts.deployed} labelColor="muted" valueColor="ink" />
        <CountCard label="Rolled back" value={counts.rolledBack} tone="rose" valueColor="danger" />
      </div>

      <Card className="row row--wrap gap-10 dep-flow">
        <span className="text-body">
          <strong>Flow:</strong> developer requests staging when dev-done → DevOps deploys → tester tests on staging → PC/PM request production → 5
          gates → PM GO → DevOps deploys · rollback needs a reason.
        </span>
        {canRequestProd && (
          <Select
            className="brand-input dep-flow__select ml-auto"
            size="small"
            value={null}
            placeholder="Request production release…"
            options={prodOpts}
            popupMatchSelectWidth={false}
            onChange={(v) => v && run(requestProduction, v)}
          />
        )}
      </Card>

      {isDevOps && (
        <div className="dep-record row row--wrap">
          <span className="fw-700 text-ink">Deploy record</span>
          <Select className="brand-input dep-record__smoke" size="small" value={smoke} options={SMOKE_OPTIONS} onChange={setSmoke} popupMatchSelectWidth={false} />
          <Input
            className="brand-input dep-record__downtime"
            size="small"
            value={downtime}
            onChange={(e) => setDowntime(e.target.value)}
            placeholder="Downtime window (e.g. 22:00–22:15 or none)"
          />
          <Input
            className="brand-input dep-record__note"
            size="small"
            value={note}
            onChange={(e) => dispatch(actionNoteChanged(e.target.value))}
            placeholder="Note / rollback reason"
          />
        </div>
      )}

      <div className="section-title__text">Queue</div>
      {queue.length > 0 && (
        <div className="dep-grid">
          {queue.map((r) => (
            <ReleaseCard key={r.id} r={r} onDeploy={deploy} />
          ))}
        </div>
      )}

      <div className="section-title__text">Deployed · rolled back</div>
      {history.length > 0 && (
        <div className="dep-grid">
          {history.map((r) => (
            <ReleaseCard key={r.id} r={r} onDeploy={deploy} />
          ))}
        </div>
      )}
    </div>
  );
}
