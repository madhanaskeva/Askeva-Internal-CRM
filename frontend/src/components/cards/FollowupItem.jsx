import { Button, Input } from "antd";
import { useState } from "react";
import { crmActions } from "../../redux/slices/crmSlice";
import { withCtx } from "../../utils/actions/context";
import { cx } from "../../utils/cx";
import CheckToggle from "../common/CheckToggle";

/**
 * Follow-up row with done toggle, optional court (ball-with-us) toggle and an outcome log.
 * @param {"board"|"compact"|"minimal"} variant
 *   board   — follow-ups page card (court toggle, shadow)
 *   compact — project detail list
 *   minimal — dashboard "today" list (no log input)
 */
export default function FollowupItem({ followup: f, variant = "board" }) {
  const [draft, setDraft] = useState("");
  const toggle = () => withCtx(crmActions.followupToggled, { followupId: f.id });
  const toggleCourt = () => withCtx(crmActions.followupCourtToggled, { followupId: f.id });
  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    withCtx(crmActions.followupCommented, { followupId: f.id, text });
    setDraft("");
  };

  if (variant === "minimal") {
    return (
      <div className={cx("list-row list-row--top", `tone-${f.rowTone}`)}>
        <CheckToggle checked={f.done} onChange={toggle} title="Mark done" />
        <div className="flex-1">
          <div className={cx("fw-600 text-ink", f.done && "strike")}>{f.title}</div>
          <div className="meta">{f.meta}</div>
        </div>
        <span className="pill tone-transparent">{f.type}</span>
      </div>
    );
  }

  return (
    <div className={cx("list-row list-row--top", variant === "board" && "list-row--card", `tone-${f.rowTone}`)}>
      <CheckToggle checked={f.done} onChange={toggle} title="Mark done" />
      <div className="flex-1">
        {variant === "board" && (
          <div className="row row--between gap-6">
            <span className="mono-meta">{f.project} · {f.type}</span>
            <button type="button" title="Switch who owes the next action" className={cx("pill pill--xs pill-btn", `tone-${f.courtTone}`)} onClick={toggleCourt}>
              {f.courtLabel}
            </button>
          </div>
        )}
        <div className={cx("fw-600 text-ink", f.done && "strike")}>{f.title}</div>
        <div className={`fs-11 text-${f.dueColor}`}>
          {variant === "board" ? `${f.channel} · ${f.with} · ${f.dueLabel}` : `${f.type} · ${f.channel} · ${f.dueLabel}`}
        </div>
        {f.comments.length > 0 && (
          <div className={cx("stack gap-4 followup-log", variant === "board" && "followup-log--divided")}>
            {f.comments.map((c) => (
              <div key={c.key} className="fs-11 text-body">
                <span className="mono-meta">{c.date}</span> · {c.text}
              </div>
            ))}
          </div>
        )}
        <div className="row gap-6 followup-log__input">
          <Input
            size="small"
            className="brand-input input-pill tone-paper"
            value={draft}
            placeholder="Add outcome / review…"
            onChange={(e) => setDraft(e.target.value)}
            onPressEnter={addComment}
          />
          <Button size="small" className="btn-pill btn-xs tone-lime" onClick={addComment}>Log</Button>
        </div>
      </div>
    </div>
  );
}
