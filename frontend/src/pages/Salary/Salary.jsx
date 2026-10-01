import { useState } from "react";
import ProgressBar from "../../components/charts/ProgressBar";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import StatCard from "../../components/common/StatCard";
import DataTable from "../../components/tables/DataTable";
import { useDispatch } from "react-redux";
import { modalOpened } from "../../redux/slices/uiSlice";
import { runPayroll } from "../../utils/actions/adminActions";
import { cx } from "../../utils/helpers/classNames";
import { TODAY, monthLabel, shiftMonth } from "../../utils/helpers/date";
import { useSalary } from "./useSalary";
import { useAction } from "../../app/useCrm";
import { toggleStaffStatus } from "../../utils/entities/staffUtils";
import { togglePayslipPaid } from "../../utils/entities/payrollUtils";

/** Salary & payroll — employees, monthly payslips and project cost allocation. */
export default function Salary() {
  const dispatch = useDispatch();
  const run = useAction();
  const [payMonth, setPayMonth] = useState(TODAY.slice(0, 7));
  const { rows, stats, history, payrollRun, gross, ded, net } = useSalary(payMonth);

  const columns = [
    {
      title: "Employee",
      key: "emp",
      render: (_, s) => (
        <div className="row gap-8">
          <button
            type="button"
            title="Toggle active"
            className={cx("sal-status-dot", s.active ? "tone-green" : "tone-white")}
            onClick={() => run(toggleStaffStatus, { staffId: s.id })}
          />
          <div className="flex-1">
            <div className="fw-700 text-ink">{s.name}</div>
            <div className="fs-10 text-muted">{s.role} · {s.dept} · since {s.joined}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Monthly CTC",
      key: "ctc",
      render: (_, s) => (
        <>
          <div className="fw-600 text-ink">{s.ctc}</div>
          <div className="fs-10 text-muted">{s.salary} + {s.allowances}</div>
        </>
      ),
    },
    { title: "Day rate", dataIndex: "rate", key: "rate", render: (v) => <span className="font-mono fs-11 text-ink">{v}</span> },
    {
      title: "Utilisation",
      key: "util",
      render: (_, s) => (
        <div className="sal-util">
          <div className={`fs-11 fw-600 text-${s.utilColor}`}>{s.utilLabel}</div>
          <ProgressBar pct={s.util} height={5} fill={s.utilFill} className="mt-3" />
          <div className="fs-10 text-muted">{s.daysLabel}</div>
        </div>
      ),
    },
    {
      title: "Allocated to projects",
      key: "alloc",
      render: (_, s) => (
        <>
          <div className="fw-600 text-ink">{s.allocated}</div>
          <div className="fs-10 text-muted">idle {s.idle}</div>
          {s.alloc.map((a) => (
            <div key={a.project} className="fs-10 text-body">{a.project} · {a.label}</div>
          ))}
        </>
      ),
    },
    {
      title: "Net pay",
      key: "net",
      render: (_, s) => (
        <>
          <div className="fw-700 text-ink">{s.net}</div>
          <div className="fs-10 text-muted">bonus {s.bonus} · ded. {s.deductions}</div>
          {s.note && <div className="fs-10 text-muted">{s.note}</div>}
        </>
      ),
    },
    {
      title: "Payslip",
      key: "pay",
      align: "right",
      render: (_, s) => (
        <div className="stack gap-4 sal-pay">
          <button
            type="button"
            className={cx("pill pill--xs pill-btn", `tone-${s.payTone}`)}
            onClick={() => s.entry && run(togglePayslipPaid, { entryId: s.entry.id })}
          >
            {s.payStatus}
          </button>
          {s.entry && (
            <PillButton size="xxs" onClick={() => dispatch(modalOpened({ kind: "payAdjust", extra: { entry: s.entry } }))}>
              Adjust
            </PillButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="grid-auto min-200 grid-gap-14">
        {stats.map((s) => (
          <StatCard key={s.key} label={s.label} value={s.value} sub={s.sub} tone={s.tone} size="md" />
        ))}
      </div>

      <Card className="stack gap-12">
        <div className="row row--between row--wrap gap-12">
          <div className="row gap-8">
            <button type="button" className="sal-month-btn" aria-label="Previous month" onClick={() => setPayMonth((m) => shiftMonth(m, -1))}>←</button>
            <span className="font-display text-ink sal-month">Payroll · {monthLabel(payMonth)}</span>
            <button type="button" className="sal-month-btn" aria-label="Next month" onClick={() => setPayMonth((m) => shiftMonth(m, 1))}>→</button>
          </div>
          <div className="row row--wrap gap-8">
            {payrollRun && (
              <span className="fs-12 text-body">
                Gross <strong className="text-ink">{gross}</strong> · Deductions <strong className="text-ink">{ded}</strong> · Net <strong className="text-ink">{net}</strong>
              </span>
            )}
            <PillButton size="sm" tone="lime" shadow onClick={() => run(runPayroll, payMonth)}>Run payroll for month</PillButton>
            <PillButton size="sm" tone="ink" className="btn-shadow-green" onClick={() => dispatch(modalOpened({ kind: "staff" }))}>+ Employee</PillButton>
          </div>
        </div>
        <div className="row row--wrap gap-6">
          {history.map((h) => (
            <button key={h.month} type="button" className={cx("chip sal-history", h.month === payMonth ? "tone-ink" : "tone-white")} onClick={() => setPayMonth(h.month)}>
              <strong>{h.label}</strong> · {h.net} · {h.count}
            </button>
          ))}
        </div>
      </Card>

      <DataTable columns={columns} dataSource={rows} />

      <div className="fs-11 text-muted">
        Day rate = (basic + allowances) ÷ working days. Project staff cost in Finance uses each assigned employee&apos;s real day rate; utilisation = days logged on projects ÷ working days. Default deduction on payroll run = 12% of basic (PF); adjust per payslip.
      </div>
    </div>
  );
}
