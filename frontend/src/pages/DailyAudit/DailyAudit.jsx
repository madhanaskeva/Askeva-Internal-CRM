import { useMemo, useState } from "react";
import Card from "../../components/common/Card";
import Pill from "../../components/common/Pill";
import PillButton from "../../components/common/PillButton";
import { useNavigate } from "react-router-dom";
import { pathFor } from "../../utils/helpers/routes";
import { useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { cx } from "../../utils/helpers/cx";
import { TODAY, addDays } from "../../utils/helpers/date";
import { auditDateLabel, auditRows, auditTotals } from "../../utils/domain/audit";
import { teamPeople } from "../../utils/domain/team";
import { useAction, useData, useMe } from "../../app/useCrm";
import { signAudit } from "../../utils/entities/ruleUtils";

const Col = ({ title, titleClass = "text-muted", children, last }) => (
  <div className={cx("audit-col", last && "audit-col--last")}>
    <div className={`audit-col__title ${titleClass}`}>{title}</div>
    {children}
  </div>
);

/** Daily audit — person → date → assigned → done → blocked → evidence, with PC/PM sign-offs. */
export default function DailyAudit() {
  const run = useAction();
  const navigate = useNavigate();
  const data = useData();
  const role = useSelector(selectRole);
  const me = useMe();
  const [date, setDate] = useState(TODAY);

  const rows = useMemo(() => auditRows(data, teamPeople(data), date, role, me), [data, date, role, me]);
  const sign = (key, who) => run(signAudit, { key, who });

  return (
    <div className="page">
      <div className="row row--between row--wrap gap-12">
        <div className="row gap-8">
          <button type="button" className="audit-nav-btn" aria-label="Previous day" onClick={() => setDate((d) => addDays(d, -1))}>←</button>
          <span className="font-display text-ink audit-date">{auditDateLabel(date)}</span>
          <button type="button" className="audit-nav-btn" aria-label="Next day" onClick={() => date < TODAY && setDate((d) => addDays(d, 1))}>→</button>
          <PillButton size="xs" onClick={() => setDate(TODAY)}>Today</PillButton>
        </div>
        <span className="fs-11 text-muted">{auditTotals(rows)}</span>
      </div>

      <div className="stack gap-12">
        {rows.map((a) => (
          <Card key={a.key} flush>
            <div className={cx("audit-head", a.isIdle && "tone-rose")}>
              <div className="row row--baseline row--wrap gap-10">
                <span className="font-display text-ink audit-person">{a.person}</span>
                <span className="mono-meta">{a.role}</span>
                {a.isIdle && <Pill size="xs" tone="danger">IDLE — assigned work, no activity</Pill>}
                {a.noWork && <Pill size="xs" tone="paper">nothing assigned</Pill>}
              </div>
              <div className="row row--wrap gap-8">
                <span className="fs-11 fw-600 text-ink">{a.hoursLabel}</span>
                {a.canOpenDetail && (
                  <PillButton size="xxs" onClick={() => navigate(pathFor("team") + `?person=${encodeURIComponent(a.person)}`)}>Full record →</PillButton>
                )}
                <button type="button" className={cx("pill pill--xs pill-btn", a.pcSigned ? "tone-green" : "tone-white")} disabled={a.pcSigned} onClick={() => sign(a.key, "pc")}>
                  PC daily sign-off
                </button>
                <button type="button" className={cx("pill pill--xs pill-btn", a.pmSigned ? "tone-green" : "tone-white")} disabled={a.pmSigned} onClick={() => sign(a.key, "pm")}>
                  PM review
                </button>
              </div>
            </div>
            <div className="audit-summary">{a.summary}</div>
            <div className="grid-auto min-200 audit-cols">
              <Col title="Assigned">
                {a.assigned.map((x, i) => <div key={i} className="audit-line text-ink">· {x}</div>)}
              </Col>
              <Col title="Completed · evidence" titleClass="text-green">
                {a.completed.map((x, i) => (
                  <div key={i} className="audit-line text-ink">✓ {x.title} <span className="text-muted">— {x.verified}</span></div>
                ))}
                {a.bugsFixed.map((x, i) => <div key={"f" + i} className="audit-line text-ink">✓ fixed {x}</div>)}
                {a.bugsRaised.map((x, i) => <div key={"r" + i} className="audit-line text-ink">✓ raised {x}</div>)}
                {a.tests > 0 && <div className="audit-line text-ink">✓ {a.tests} test action(s)</div>}
              </Col>
              <Col title="Pending">
                {a.pending.map((x, i) => <div key={i} className="audit-line text-body">· {x}</div>)}
              </Col>
              <Col title="Allocation">
                {a.alloc.map((x, i) => (
                  <div key={i} className="audit-line text-ink">· {x.text} <span className="text-muted">— {x.task}</span></div>
                ))}
                <div className="fs-10 text-muted mt-4">{a.allocMeta}</div>
              </Col>
              <Col title="Blocked" titleClass="text-danger" last>
                {a.blocked.map((x, i) => <div key={i} className="audit-line text-danger">✕ {x.task} — {x.note}</div>)}
              </Col>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
