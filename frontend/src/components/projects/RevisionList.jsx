import Pill from "../common/Pill";
import PillButton from "../common/PillButton";
import { crmActions } from "../../redux/slices/crmSlice";
import { withCtx } from "../../features/actions/context";

/**
 * Deadline revision requests (newest first) with PM approve / Reject on pending ones.
 * Shared by the Deadlines page and Project detail.
 * @param {string} projectId
 * @param {object[]} revisions  buildDeadlineRow(...).revisions
 */
export default function RevisionList({ projectId, revisions }) {
  const decide = (revisionId, approve) => withCtx(crmActions.revisionDecided, { projectId, revisionId, approve });

  return revisions.map((v) => (
    <div key={v.id} className="dl-revision row row--wrap">
      <Pill size="xs" tone={v.tone}>{v.status}</Pill>
      <span className="text-ink fw-600">
        {v.fromTo} ({v.delta})
      </span>
      <span className="text-muted">
        {v.date} · {v.category} · {v.reason}
      </span>
      {v.isPending && (
        <>
          <PillButton size="xxs" tone="green" className="dl-revision__btn" onClick={() => decide(v.id, true)}>
            PM approve
          </PillButton>
          <PillButton size="xxs" tone="white" className="dl-revision__btn" onClick={() => decide(v.id, false)}>
            Reject
          </PillButton>
        </>
      )}
    </div>
  ));
}
