import StatCard from "../../components/common/StatCard";
import FinanceProjectCard from "./FinanceProjectCard";
import { useFinance } from "./useFinance";

export default function Finance() {
  const { stats, finRows } = useFinance();

  return (
    <div className="page">
      <div className="grid-auto min-200 grid-gap-14">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} size="md" />
        ))}
      </div>

      <div className="stack gap-16">
        {finRows.map((r) => (
          <FinanceProjectCard key={r.id} row={r} />
        ))}
      </div>
    </div>
  );
}
