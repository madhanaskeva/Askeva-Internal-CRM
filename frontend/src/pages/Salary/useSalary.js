import { useMemo } from "react";
import { fmt, monthLabel } from "../../utils/helpers/date";
import { inr } from "../../utils/helpers/format";
import { staffRate } from "../../utils/domain/finance";
import { EFFORT_KEYS } from "../../data";
import { useData } from "../../app/useCrm";

/** Salary & payroll view-models for one month — port of the original salary section. */
export function useSalary(payMonth) {
  const data = useData();

  return useMemo(() => {
    const staff = data.staff || [];
    const payroll = data.payroll || [];

    // Effort-days logged on projects by this person × their real day rate.
    const allocFor = (s) => {
      const rows = [];
      data.projects.forEach((p) => {
        const t = p.team || {};
        const e = p.effort || {};
        EFFORT_KEYS.forEach((k) => {
          const name = k === "pc" ? "PC" : t[k];
          if (name === s.name && (e[k] || 0) > 0) rows.push({ project: p.client, days: e[k], cost: e[k] * staffRate(s) });
        });
      });
      return rows;
    };

    let totalAllocated = 0;
    const rows = staff.map((s) => {
      const rate = staffRate(s);
      const alloc = allocFor(s);
      const days = alloc.reduce((a, r) => a + r.days, 0);
      const allocated = alloc.reduce((a, r) => a + r.cost, 0);
      totalAllocated += allocated;
      const util = Math.min(150, Math.round((days / (s.workDays || 22)) * 100));
      const entry = payroll.find((pr) => pr.staffId === s.id && pr.month === payMonth);
      return {
        id: s.id,
        name: s.name,
        role: s.role,
        dept: s.dept,
        joined: fmt(s.joined),
        active: s.status === "Active",
        ctc: inr((s.salary || 0) + (s.allowances || 0)),
        salary: inr(s.salary),
        allowances: inr(s.allowances || 0),
        rate: inr(rate),
        util,
        utilLabel: util + "% utilised",
        utilColor: util < 50 ? "danger" : util > 100 ? "green" : "ink",
        utilFill: util < 50 ? "danger" : "ink",
        daysLabel: `${days} days logged`,
        allocated: inr(allocated),
        idle: inr(Math.max(0, (s.salary || 0) + (s.allowances || 0) - allocated)),
        alloc: alloc.map((r) => ({ project: r.project, label: `${r.days}d · ${inr(r.cost)}` })),
        entry,
        payStatus: entry ? entry.status : "Not run",
        payTone: entry ? (entry.status === "Paid" ? "green" : "lime") : "white",
        net: entry ? inr(entry.gross + (entry.bonus || 0) - (entry.deductions || 0)) : "—",
        bonus: entry ? inr(entry.bonus || 0) : "—",
        deductions: entry ? inr(entry.deductions || 0) : "—",
        note: entry?.note || "",
      };
    });

    const monthEntries = payroll.filter((pr) => pr.month === payMonth);
    const totals = monthEntries.reduce(
      (a, e) => {
        const net = e.gross + (e.bonus || 0) - (e.deductions || 0);
        return { gross: a.gross + e.gross + (e.bonus || 0), ded: a.ded + (e.deductions || 0), net: a.net + net, paid: a.paid + (e.status === "Paid" ? net : 0) };
      },
      { gross: 0, ded: 0, net: 0, paid: 0 },
    );
    const active = staff.filter((s) => s.status === "Active");
    const monthlyCTC = active.reduce((a, s) => a + (s.salary || 0) + (s.allowances || 0), 0);
    const payrollRun = monthEntries.length > 0;

    const stats = [
      { key: "ctc", label: "Monthly payroll (CTC)", value: inr(monthlyCTC), sub: `${active.length} active employees`, tone: "ink800" },
      {
        key: "net",
        label: monthLabel(payMonth) + " · net payable",
        value: payrollRun ? inr(totals.net) : "Not run",
        sub: payrollRun ? `${inr(totals.paid)} paid · ${inr(totals.net - totals.paid)} pending` : "Run payroll to generate payslips",
        tone: "white",
      },
      { key: "alloc", label: "Allocated to projects", value: inr(totalAllocated), sub: `${monthlyCTC ? Math.round((totalAllocated / monthlyCTC) * 100) : 0}% of monthly CTC recovered by logged effort`, tone: "lime" },
      { key: "idle", label: "Bench / idle cost", value: inr(Math.max(0, monthlyCTC - totalAllocated)), sub: "salary not covered by project effort", tone: monthlyCTC - totalAllocated > monthlyCTC * 0.4 ? "danger" : "green" },
    ];

    const history = [...new Set(payroll.map((pr) => pr.month))]
      .sort()
      .reverse()
      .slice(0, 6)
      .map((m) => {
        const es = payroll.filter((pr) => pr.month === m);
        const net = es.reduce((a, e) => a + e.gross + (e.bonus || 0) - (e.deductions || 0), 0);
        return { month: m, label: monthLabel(m), net: inr(net), count: `${es.filter((e) => e.status === "Paid").length}/${es.length} paid` };
      });

    return { rows, stats, history, payrollRun, gross: inr(totals.gross), ded: inr(totals.ded), net: inr(totals.net) };
  }, [data, payMonth]);
}
