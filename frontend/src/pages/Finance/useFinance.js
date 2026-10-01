import { useMemo } from "react";
import { inr } from "../../utils/helpers/format";
import { useFinRows, usePortfolio } from "../../app/useCrm";

/** Finance view-models — port of the original `finStats` + `finRows`. */
export function useFinance() {
  const port = usePortfolio();
  const finRows = useFinRows();

  const stats = useMemo(
    () => [
      { key: "rev", label: "Contracted revenue", value: inr(port.revenue), sub: `${inr(port.received)} received · ${inr(port.due)} outstanding`, tone: "ink800" },
      { key: "staff", label: "Staff cost (actual / planned)", value: inr(port.actualStaff), sub: `planned ${inr(port.plannedStaff)} · ${port.actualDays}/${port.plannedDays} man-days`, tone: "white" },
      { key: "exp", label: "Expenses", value: inr(port.expenses), sub: "servers, domains, APIs, travel", tone: "white" },
      { key: "pl", label: "Forecast P&L", value: inr(port.forecastPL), sub: `${port.margin}% portfolio margin · cash P&L ${inr(port.cashPL)}`, tone: port.forecastPL < 0 ? "danger" : "green" },
    ],
    [port],
  );

  return { stats, finRows };
}
