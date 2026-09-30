import { useMemo } from "react";
import Card from "../../components/common/Card";
import StatCard from "../../components/common/StatCard";
import { useSelector } from "react-redux";
import { selectData, selectDeadlineRows, selectHealthMap } from "../../redux/selectors";
import { healthTone } from "../../utils/domain/tones";
import DeadlineCard from "./DeadlineCard";

const STATUSES = ["On track", "At risk", "Delayed"];

export default function Deadlines() {
  const data = useSelector(selectData);
  const H = useSelector(selectHealthMap);
  const deadlineRows = useSelector(selectDeadlineRows);

  const { dlStats, totalExt } = useMemo(
    () => ({
      dlStats: STATUSES.map((s) => ({ label: s, value: data.projects.filter((p) => H[p.id].status === s).length, tone: healthTone(s) })),
      totalExt: Object.values(H).reduce((s, h) => s + h.ext, 0),
    }),
    [data, H],
  );

  return (
    <div className="page">
      <div className="grid-auto grid-gap-14 dl-stats">
        {dlStats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} tone={s.tone} />
        ))}
        <Card>
          <div className="label-caps text-muted">CR extensions</div>
          <div className="stat-value">
            +{totalExt}
            <span className="dl-stats__unit">d</span>
          </div>
          <div className="meta">approved timeline impact, all projects</div>
        </Card>
      </div>

      <div className="stack gap-16">
        {deadlineRows.map((r) => (
          <DeadlineCard key={r.id} r={r} />
        ))}
      </div>
    </div>
  );
}
