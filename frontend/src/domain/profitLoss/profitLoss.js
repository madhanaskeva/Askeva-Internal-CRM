// P&L module — port of the original "P&L module" block of renderVals.
// Colours are returned as text-colour keys (`.text-*`) and tone keys (`.tone-*`).
import { COMPLETED_STAGE, STAGES } from "../../constants/crm";
import { TODAY, daysBetween, monthKey, monthLabelShort } from "../../utils/date";
import { inr } from "../../utils/format";
import { roleRate, staffRate, teamOf } from "../finance/finance";
import { marginColor } from "../tones/tones";

export const PL_PERIODS = [
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "all", label: "All time" },
];

const sum = (list, fn) => list.reduce((s, x) => s + fn(x), 0);
const pct = (v, total) => Math.round((v / total) * 100);

/**
 * @param {object} data   role-scoped dataset (selectData)
 * @param {object} FIN    selectFinMap
 * @param {object} port   selectPortfolio (incl. margin)
 * @param {"month"|"quarter"|"all"} period
 */
export function computeProfitLoss(data, FIN, port, period) {
  const curMonth = monthKey(TODAY);
  const qStart = (() => {
    const m = +curMonth.slice(5) - 1;
    return curMonth.slice(0, 5) + String(m - (m % 3) + 1).padStart(2, "0");
  })();
  const inPeriod = (d) => {
    if (!d) return false;
    const k = monthKey(d);
    return period === "month" ? k === curMonth : period === "quarter" ? k >= qStart && k <= curMonth : true;
  };
  const rate = (p, k) => roleRate(data, p, k);
  const staffCost = (p, pred) => sum((p.effortLog || []).filter((e) => pred(e.date)), (e) => e.days * rate(p, e.role));
  const recognisedOf = (p, pred) => sum((p.invoices || []).filter((i) => i.status === "Received" && pred(i.date)), (i) => i.amount);
  const expensesOf = (p, pred) => sum((p.expenses || []).filter((x) => pred(x.date)), (x) => x.amount);
  const reworkCost = (p) => {
    const rounds = sum(data.tasks.filter((t) => t.projectId === p.id), (t) => (t.history || []).filter((x) => x.to === "rework" && x.from !== x.to).length);
    return rounds * (rate(p, "backend") || rate(p, "ui") || (p.budget || {}).dayRate || 0);
  };
  const scopeCreep = (p) => sum((p.effortLog || []).filter((e) => e.unapproved), (e) => e.days * rate(p, e.role));

  // ---- per-project rows ----
  const rows = data.projects.map((p) => {
    const f = FIN[p.id];
    const recognised = recognisedOf(p, inPeriod);
    const staff = staffCost(p, inPeriod);
    const exp = expensesOf(p, inPeriod);
    const pl = recognised - staff - exp;
    const progress = Math.round((p.stage / COMPLETED_STAGE) * 100);
    const effortPct = f.plannedDays ? Math.round((f.actualDays / f.plannedDays) * 100) : 0;
    const varAtComp = f.forecastPL - f.plannedPL;
    const burnKey = effortPct > progress + 15 ? "danger" : effortPct > progress ? "lime500" : "green";
    return {
      id: p.id,
      client: p.client,
      code: p.code,
      billing: p.billing,
      stage: STAGES[p.stage],
      recognised: inr(recognised),
      staff: inr(staff),
      exp: inr(exp),
      pl: inr(pl),
      plColor: pl < 0 ? "danger" : "green",
      plRaw: pl,
      plannedPL: inr(f.plannedPL),
      forecastPL: inr(f.forecastPL),
      forecastColor: f.forecastPL < 0 ? "danger" : "ink",
      variance: (varAtComp >= 0 ? "+" : "−") + inr(Math.abs(varAtComp)),
      varianceColor: varAtComp < 0 ? "danger" : "green",
      margin: f.margin == null ? "—" : f.margin + "%",
      marginColor: marginColor(f.margin),
      progress,
      effortPct,
      burnKey,
      burnNote: burnKey === "danger" ? "burning faster than delivering" : burnKey === "lime500" ? "slightly ahead of progress" : "healthy",
      barRev: f.revenue,
      barCost: f.forecastCost,
    };
  });

  const maxBar = Math.max(1, ...rows.map((r) => Math.max(r.barRev, r.barCost)));
  const bars = rows.map((r) => ({
    id: r.id,
    client: r.client,
    margin: r.margin,
    marginColor: r.marginColor,
    revW: pct(r.barRev, maxBar),
    costW: pct(r.barCost, maxBar),
    revLabel: inr(r.barRev),
    costLabel: inr(r.barCost),
  }));

  // ---- period totals ----
  const plTotal = sum(rows, (r) => r.plRaw);
  const recognisedTotal = sum(data.projects, (p) => recognisedOf(p, inPeriod));
  const staffTotal = sum(data.projects, (p) => staffCost(p, inPeriod));
  const expTotal = sum(data.projects, (p) => expensesOf(p, inPeriod));
  const reworkTotal = sum(data.projects, reworkCost);
  const creepTotal = sum(data.projects, scopeCreep);
  const crRevTotal = sum(Object.values(FIN), (f) => f.crRev);

  const stats = [
    { key: "rev", label: "Revenue recognised", value: inr(recognisedTotal), sub: "cash received in period", tone: "ink800" },
    { key: "staff", label: "Staff cost", value: inr(staffTotal), sub: "effort logged × real day rate", tone: "white" },
    { key: "exp", label: "Expenses", value: inr(expTotal), sub: "servers, domains, APIs", tone: "white" },
    { key: "pl", label: "Period P&L", value: inr(plTotal), sub: recognisedTotal ? pct(plTotal, recognisedTotal) + "% margin" : "no revenue in period", tone: plTotal < 0 ? "danger" : "green" },
    { key: "fc", label: "Forecast at completion", value: inr(port.forecastPL), sub: port.margin + "% portfolio margin", tone: "lime" },
  ];

  // ---- margin trend: last 6 months with activity, up to now ----
  const monthSet = new Set([curMonth]);
  data.projects.forEach((p) => {
    (p.invoices || []).forEach((i) => monthSet.add(monthKey(i.date)));
    (p.effortLog || []).forEach((e) => monthSet.add(monthKey(e.date)));
    (p.expenses || []).forEach((x) => monthSet.add(monthKey(x.date)));
  });
  const months = [...monthSet].filter((k) => k <= curMonth).sort().slice(-6);
  const trendRaw = months.map((k) => {
    const inMonth = (d) => monthKey(d) === k;
    const rev = sum(data.projects, (p) => recognisedOf(p, inMonth));
    const cost = sum(data.projects, (p) => staffCost(p, inMonth) + expensesOf(p, inMonth));
    const m = rev ? Math.round(((rev - cost) / rev) * 100) : null;
    return { key: k, label: monthLabelShort(k), rev, cost, marginLabel: m == null ? "—" : m + "%", color: m == null ? "muted" : m < 20 ? "danger" : "green" };
  });
  const trendMax = Math.max(1, ...trendRaw.map((t) => Math.max(t.rev, t.cost)));
  const trend = trendRaw.map((t) => ({ ...t, revH: pct(t.rev, trendMax), costH: pct(t.cost, trendMax), revLabel: inr(t.rev), costLabel: inr(t.cost) }));

  // ---- cost breakdown ----
  const costTotal = Math.max(1, staffTotal + expTotal + reworkTotal);
  const costBreak = [
    ["Salary (productive)", Math.max(0, staffTotal - reworkTotal), "ink"],
    ["Rework (failed → rework rounds)", reworkTotal, "danger"],
    ["Expenses", expTotal, "lime"],
  ].map(([label, v, tone]) => ({ key: label, label, value: inr(v), pct: pct(v, costTotal), tone }));

  // ---- receivables ageing ----
  const BUCKETS = [
    ["Not yet due", "paper"],
    ["1–15 days", "white"],
    ["16–30 days", "lime"],
    ["31+ days", "danger"],
  ];
  const bucketSums = Object.fromEntries(BUCKETS.map(([l]) => [l, 0]));
  const ageingRows = [];
  data.projects.forEach((p) =>
    (p.invoices || []).filter((i) => i.status !== "Received").forEach((i) => {
      const od = -daysBetween(i.date, TODAY);
      const k = od <= 0 ? "Not yet due" : od <= 15 ? "1–15 days" : od <= 30 ? "16–30 days" : "31+ days";
      bucketSums[k] += i.amount;
      ageingRows.push({
        key: p.id + ":" + i.id,
        client: p.client,
        label: i.label,
        amount: inr(i.amount),
        dueIso: i.date,
        age: od <= 0 ? "due in " + -od + "d" : od + "d overdue",
        color: od <= 0 ? "muted" : od <= 15 ? "ink" : "danger",
      });
    }),
  );
  const ageTotal = sum(Object.values(bucketSums), (x) => x);
  const ageDiv = Math.max(1, ageTotal);
  const ageing = {
    buckets: BUCKETS.map(([label, tone]) => ({ key: label, label, tone, value: inr(bucketSums[label]), pct: pct(bucketSums[label], ageDiv) })),
    rows: ageingRows.sort((a, b) => a.dueIso.localeCompare(b.dueIso)),
    total: inr(ageTotal),
  };

  // ---- per-client lifetime value ----
  const byClient = {};
  data.projects.forEach((p) => {
    const f = FIN[p.id];
    const c = (byClient[p.client] = byClient[p.client] || { client: p.client, projects: 0, revenue: 0, received: 0, pl: 0, crRev: 0 });
    c.projects++;
    c.revenue += f.revenue;
    c.received += f.received;
    c.pl += f.forecastPL;
    c.crRev += f.crRev;
  });
  const clients = Object.values(byClient)
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({
      ...c,
      revenueL: inr(c.revenue),
      receivedL: inr(c.received),
      plL: inr(c.pl),
      crRevL: inr(c.crRev),
      margin: c.revenue ? pct(c.pl, c.revenue) + "%" : "—",
      plColor: c.pl < 0 ? "danger" : "green",
    }));

  // ---- per-person cost vs billable output ----
  const people = (data.staff || [])
    .filter((s) => s.status === "Active" && s.role !== "Admin")
    .map((s) => {
      const r = staffRate(s) || 0;
      let days = 0;
      let billableRev = 0;
      data.projects.forEach((p) => {
        const f = FIN[p.id];
        const d = sum((p.effortLog || []).filter((e) => inPeriod(e.date) && teamOf(p, e.role) === s.name), (e) => e.days);
        days += d;
        if (f.plannedDays && f.revenue) billableRev += (d / f.plannedDays) * f.revenue;
      });
      const cost = days * r;
      const ratio = cost ? Math.round((billableRev / cost) * 10) / 10 : null;
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        days: days + "d",
        cost: inr(cost),
        output: inr(Math.round(billableRev)),
        ratioNum: ratio,
        ratio: ratio == null ? "—" : ratio + "×",
        ratioColor: ratio == null ? "muted" : ratio < 1.5 ? "danger" : ratio < 2.5 ? "ink" : "green",
        note: ratio == null ? "no effort in period" : ratio < 1.5 ? "below 1.5× — review allocation" : ratio < 2.5 ? "ok" : "strong",
      };
    })
    // Same comparator as the original: people without effort (NaN) keep their relative order.
    .sort((a, b) => (b.ratioNum ?? NaN) - (a.ratioNum ?? NaN) || 0);

  const periodLabel =
    period === "month" ? monthLabelShort(curMonth) : period === "quarter" ? `Quarter · ${monthLabelShort(qStart)} – ${monthLabelShort(curMonth)}` : "All time";

  return {
    periodLabel,
    stats,
    rows,
    bars,
    trend,
    costBreak,
    ageing,
    hasAgeing: ageingRows.length > 0,
    clients,
    people,
    crRevTotal: inr(crRevTotal),
    creepTotal: inr(creepTotal),
    creepNet: inr(crRevTotal - creepTotal),
    creepNetColor: crRevTotal - creepTotal < 0 ? "danger" : "green",
    reworkTotal: inr(reworkTotal),
  };
}
