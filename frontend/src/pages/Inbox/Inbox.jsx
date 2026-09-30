import { useMemo } from "react";
import CountCard from "../../components/cards/CountCard";
import InboxCard from "../../components/cards/InboxCard";
import Card from "../../components/common/Card";
import { useSelector } from "react-redux";
import { selectData, selectHealthMap, selectRole } from "../../redux/selectors";
import { buildDevWork } from "../../utils/domain/devWork";

/** Developer inbox — accept or decline new allocations the same day. */
export default function Inbox() {
  const data = useSelector(selectData);
  const role = useSelector(selectRole);
  const H = useSelector(selectHealthMap);
  const { inbox, inboxLate } = useMemo(() => buildDevWork(data, role, H), [data, role, H]);

  return (
    <div className="page">
      <div className="grid-auto count-grid">
        <CountCard label="Awaiting my acceptance" value={inbox.length} tone="lime" />
        <CountCard label="Past same-day limit" value={inboxLate} tone="rose" valueColor="danger" />
        <Card tone="ink800" className="count-card fs-11">
          <div className="label-caps text-lime mb-4">Rule</div>
          Accept or decline the same day it lands. Decline needs a reason and returns the task to the PC. The due date is the PC&apos;s — accepting does not change it.
        </Card>
      </div>
      {inbox.length === 0 && <Card className="text-muted fs-12-5">Inbox is clear — nothing waiting for your acceptance.</Card>}
      <div className="stack gap-10">
        {inbox.map((t) => (
          <InboxCard key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}
