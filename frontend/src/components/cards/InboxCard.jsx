import { useState } from "react";
import { Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { actionNoteChanged, taskOpened } from "../../redux/slices/uiSlice";
import { acceptTask, declineTask } from "../../utils/actions/taskActions";
import PillButton from "../common/PillButton";
import { useAction } from "../../app/useCrm";

/**
 * Returns initials and background color for project avatar box matching reference image.
 */
function getProjectAvatar(projectName) {
  const name = projectName || "Internal CRM";
  let initials = "IC";
  let bg = "#c3f53c"; // Bright Lime for Internal CRM
  let color = "#1e293b";

  if (name.includes("Internal CRM") || name === "CRM") {
    initials = "IC";
    bg = "#c3f53c";
    color = "#0f172a";
  } else if (name.includes("Nova") || name === "NR") {
    initials = "NR";
    bg = "#dcfce7";
    color = "#14532d";
  } else if (name.includes("Medico") || name === "MP") {
    initials = "MP";
    bg = "#dbeafe";
    color = "#1e40af";
  } else if (name.includes("EduSpark") || name === "ES") {
    initials = "ES";
    bg = "#ffedd5";
    color = "#9a3412";
  } else if (name.includes("FinTrust") || name === "FT") {
    initials = "FT";
    bg = "#f3e8ff";
    color = "#6b21a8";
  } else if (name.includes("Website") || name === "WE") {
    initials = "WE";
    bg = "#d1fae5";
    color = "#065f46";
  } else if (name.includes("Reports") || name === "RP") {
    initials = "RP";
    bg = "#fee2e2";
    color = "#991b1b";
  } else {
    const words = name.split(" ");
    initials = words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
    bg = "#e2e8f0";
    color = "#334155";
  }
  return { initials, bg, color };
}

/**
 * QA Inbox Task Card with project avatar box, metadata, description, and accept/decline actions.
 */
export default function InboxCard({ t }) {
  const dispatch = useDispatch();
  const run = useAction();
  const note = useSelector((s) => s.ui.actionNote);
  const [showDeclineInput, setShowDeclineInput] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  const projectAvatar = getProjectAvatar(t.project);
  const description = t.raw?.description || t.raw?.details || "Test login, forgot password, role-based access, validation messages and session handling.";

  const handleDeclineClick = () => {
    if (!showDeclineInput) {
      setShowDeclineInput(true);
      return;
    }
    const reasonToUse = declineReason.trim() || note.trim();
    if (reasonToUse) {
      dispatch(actionNoteChanged(reasonToUse));
    }
    run(declineTask, t.id);
  };

  const handleReasonChange = (e) => {
    const val = e.target.value;
    setDeclineReason(val);
    dispatch(actionNoteChanged(val));
  };

  return (
    <div className="inbox-card p-16 bg-white br-lg border-ink stack gap-12 hover-shadow-sm transition-all">
      <div className="row gap-16 items-start">
        {/* Project Initial Avatar Box */}
        <div
          className="project-avatar-box row row--center items-center fw-800 fs-16 br-md shrink-0"
          style={{
            width: 44,
            height: 44,
            minWidth: 44,
            backgroundColor: projectAvatar.bg,
            color: projectAvatar.color,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          {projectAvatar.initials}
        </div>

        {/* Card Main Body */}
        <div className="stack gap-6 w-full">
          {/* Top Line: Badge + Time */}
          <div className="row row--between items-center w-full">
            <span className="badge-pill bg-rose-light text-rose fs-10 fw-700 px-8 py-2 br-xs uppercase tracking-wide">
              NEW ASSIGNMENT
            </span>
            <span className="fs-11 text-muted row items-center gap-4 font-mono">
              {t.assignedOn}
              <span style={{ color: "#eab308", fontSize: 14 }}>•</span>
            </span>
          </div>

          {/* Title */}
          <button
            type="button"
            className="link-block inbox-card__title text-left fs-16 fw-700 text-ink hover-text-lime"
            onClick={() => dispatch(taskOpened(t.id))}
          >
            {t.title}
          </button>

          {/* Project & Module indicator line */}
          <div className="row items-center gap-6 fs-12 text-muted fw-600">
            <span style={{ width: 3, height: 14, backgroundColor: "#c3f53c", borderRadius: 2, display: "inline-block" }} />
            <span>{t.project}</span>
            <span>•</span>
            <span>{t.stage || "Authentication"}</span>
          </div>

          {/* Meta Info Row */}
          <div className="row row--wrap items-center gap-16 fs-11 text-body mt-2">
            <span className="row items-center gap-4">
              <span className="text-muted">👤</span> Assigned by <strong className="text-ink">{t.assignedBy} (PM)</strong>
            </span>
            <span className="row items-center gap-4">
              <span className="text-muted">📅</span> Due <strong className={`text-${t.dueColor}`}>{t.due}</strong>
            </span>
            <span className="row items-center gap-4">
              <span className="text-muted">🚩</span>
              <span className={`fw-700 text-${t.priorityTone === "danger" ? "rose" : t.priorityTone === "lime" ? "amber" : "slate"}`}>
                {t.priority}
              </span>
            </span>
          </div>

          {/* Task Description */}
          <p className="fs-12 text-muted m-0 mt-4 leading-relaxed">
            {description}
          </p>

          {/* Bottom Action Row */}
          <div className="row row--end items-center gap-8 mt-8">
            {showDeclineInput && (
              <Input
                size="small"
                className="brand-input input-pill tone-paper inbox-card__reason"
                style={{ maxWidth: 280 }}
                value={declineReason}
                placeholder="Reason to decline (mandatory)…"
                onChange={handleReasonChange}
                autoFocus
              />
            )}

            <PillButton
              size="sm"
              tone={showDeclineInput ? "danger" : "white"}
              dangerText={!showDeclineInput}
              className="px-16 fw-600"
              onClick={handleDeclineClick}
            >
              {showDeclineInput ? "Confirm Decline" : "Decline"}
            </PillButton>

            <PillButton
              size="sm"
              tone="lime"
              className="px-16 fw-700 text-ink"
              onClick={() => run(acceptTask, t.id)}
            >
              Accept Task
            </PillButton>
          </div>
        </div>
      </div>
    </div>
  );
}

