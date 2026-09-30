import Card from "./Card";

/** KPI tile: caps label, big display value, small sub-line. Clickable when `onClick` is set. */
export default function StatCard({ label, value, sub, tone = "white", onClick, size }) {
  return (
    <Card tone={tone} onClick={onClick}>
      <div className="label-caps op-85">{label}</div>
      <div className={size === "md" ? "stat-value stat-value--md" : "stat-value"}>{value}</div>
      {sub ? <div className="fs-11 op-85">{sub}</div> : null}
    </Card>
  );
}
