import Card from "../common/Card";

/**
 * Compact count tile (Deploy, Settings, …). Label and value colours can differ
 * from the card tone, e.g. lime label on ink, red value on rose.
 */
export default function CountCard({ label, value, tone = "white", labelColor, valueColor }) {
  return (
    <Card tone={tone} className="count-card">
      <div className={`label-caps${labelColor ? " text-" + labelColor : ""}`}>{label}</div>
      <div className={`count-card__value${valueColor ? " text-" + valueColor : ""}`}>{value}</div>
    </Card>
  );
}
