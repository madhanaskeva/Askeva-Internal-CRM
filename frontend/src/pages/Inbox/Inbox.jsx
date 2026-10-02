import { useMemo, useState } from "react";
import { Input, Select } from "antd";
import { Search, SlidersHorizontal } from "lucide-react";
import InboxCard from "../../components/cards/InboxCard";
import Card from "../../components/common/Card";
import PillButton from "../../components/common/PillButton";
import { useSelector } from "react-redux";
import { selectRole } from "../../redux/selectors";
import { useData } from "../../app/useCrm";
import { TODAY, addDays, daysBetween } from "../../utils/helpers/date";
import { isDone, taskTrack } from "../../utils/domain/tasks";
import { mapTask } from "../../utils/domain/views";

/**
 * QA / Tester Assignment Inbox — PM to Tester workflow queue matching reference image.
 */
export default function Inbox() {
  const data = useData();
  const role = useSelector(selectRole);

  const [activeTab, setActiveTab] = useState("needsAcceptance");
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const track = role === "Tester" ? "qa" : "frontend";
  const myTasks = useMemo(() => {
    return role === "Tester"
      ? data.tasks.filter((t) => t.assignee === "Divya" || t.assignee === "Tester" || taskTrack(t) === "qa")
      : data.tasks.filter((t) => taskTrack(t) === track);
  }, [data.tasks, role, track]);

  const map = (t) => mapTask(t, data);

  // Dynamic counts for status tabs
  const tabCounts = useMemo(() => {
    const needsAcceptance = myTasks.filter((t) => t.acceptance === "pending" && !isDone(t)).length;
    const assignedToMe = myTasks.filter((t) => t.assignee !== "Unassigned" && !isDone(t)).length;
    const inProgress = myTasks.filter((t) => t.status === "doing" && !isDone(t)).length;
    const completed = myTasks.filter((t) => isDone(t) || t.status === "passed").length;
    return { needsAcceptance, assignedToMe, inProgress, completed };
  }, [myTasks]);

  // Tab filtering
  const tabFilteredTasks = useMemo(() => {
    if (activeTab === "needsAcceptance") {
      return myTasks.filter((t) => t.acceptance === "pending" && !isDone(t));
    }
    if (activeTab === "assignedToMe") {
      return myTasks.filter((t) => t.assignee !== "Unassigned" && !isDone(t));
    }
    if (activeTab === "inProgress") {
      return myTasks.filter((t) => t.status === "doing" && !isDone(t));
    }
    if (activeTab === "completed") {
      return myTasks.filter((t) => isDone(t) || t.status === "passed");
    }
    return myTasks;
  }, [myTasks, activeTab]);

  // Filter dropdown options
  const projectOptions = useMemo(() => {
    const opts = [{ value: "all", label: "Project: All" }];
    (data.projects || []).forEach((p) => {
      opts.push({ value: p.id, label: p.client || p.code });
    });
    return opts;
  }, [data.projects]);

  // Applied search & filter
  const filteredTasks = useMemo(() => {
    return tabFilteredTasks
      .map(map)
      .filter((t) => {
        // Project filter
        if (projectFilter !== "all" && t.projectId !== projectFilter) return false;
        // Priority filter
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        // Due date filter
        if (dueFilter === "today" && t.raw.due !== TODAY) return false;
        if (dueFilter === "tomorrow" && t.raw.due !== addDays(TODAY, 1)) return false;
        if (dueFilter === "week" && daysBetween(t.raw.due, TODAY) > 7) return false;
        if (dueFilter === "overdue" && !t.overdue) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchText = [t.title, t.project, t.stage, t.assignee, t.assignedBy, t.priority, t.opsKind]
            .join(" ")
            .toLowerCase();
          if (!matchText.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") return (b.assignedOn || "").localeCompare(a.assignedOn || "");
        if (sortBy === "oldest") return (a.assignedOn || "").localeCompare(b.assignedOn || "");
        if (sortBy === "priority") return (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1);
        if (sortBy === "dueDate") return a.due.localeCompare(b.due);
        return (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1) || a.due.localeCompare(b.due);
      });
  }, [tabFilteredTasks, projectFilter, priorityFilter, dueFilter, searchQuery, sortBy]);

  return (
    <div className="page stack gap-16">
      {/* Header section matching reference image */}
      <div className="stack gap-4">
        <div className="fs-11 fw-700 tracking-wider text-muted uppercase">QA DASHBOARD</div>
        <div className="row row--between row--wrap items-center gap-16">
          <div>
            <h1 className="page-title fs-28 fw-900 text-ink m-0">
              INBOX<span className="text-lime">.</span>
            </h1>
            <p className="fs-13 text-muted m-0 mt-2">
              Tasks assigned to you by Project Managers. Review, accept or decline to get started.
            </p>
          </div>

          <div className="row row--wrap gap-8 items-center">
            <Input
              prefix={<Search size={15} className="text-muted" />}
              placeholder="Search tasks, projects, modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="brand-input input-pill tone-paper"
              style={{ width: 220 }}
              allowClear
            />
            <Select
              value={projectFilter}
              onChange={setProjectFilter}
              options={projectOptions}
              className="brand-select brand-select-sm"
              popupMatchSelectWidth={false}
            />
            <Select
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={[
                { value: "all", label: "Priority: All" },
                { value: "High", label: "High" },
                { value: "Med", label: "Medium" },
                { value: "Low", label: "Low" },
              ]}
              className="brand-select brand-select-sm"
              popupMatchSelectWidth={false}
            />
            <Select
              value={dueFilter}
              onChange={setDueFilter}
              options={[
                { value: "all", label: "Due date: All" },
                { value: "today", label: "Today" },
                { value: "tomorrow", label: "Tomorrow" },
                { value: "week", label: "This Week" },
                { value: "overdue", label: "Overdue" },
              ]}
              className="brand-select brand-select-sm"
              popupMatchSelectWidth={false}
            />
            <button
              type="button"
              className="icon-btn border-ink br-md p-6 bg-paper hover-bg-white"
              title="More filters"
            >
              <SlidersHorizontal size={16} className="text-ink" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Status Tabs Bar matching reference image */}
      <div className="row row--wrap gap-8 p-4 bg-paper br-md border-ink items-center">
        <PillButton
          size="sm"
          tone={activeTab === "needsAcceptance" ? "lime" : "white"}
          className="fw-700 row gap-6 items-center px-12"
          onClick={() => setActiveTab("needsAcceptance")}
        >
          <span>Needs acceptance</span>
          <span className="badge-pill bg-lime text-ink fs-10 font-mono fw-700 px-6 py-2 br-xs">
            {tabCounts.needsAcceptance}
          </span>
        </PillButton>

        <PillButton
          size="sm"
          tone={activeTab === "assignedToMe" ? "lime" : "white"}
          className="fw-700 row gap-6 items-center px-12"
          onClick={() => setActiveTab("assignedToMe")}
        >
          <span>Assigned to me</span>
          <span className="badge-pill bg-paper text-ink fs-10 font-mono fw-700 px-6 py-2 br-xs">
            {tabCounts.assignedToMe}
          </span>
        </PillButton>

        <PillButton
          size="sm"
          tone={activeTab === "inProgress" ? "lime" : "white"}
          className="fw-700 row gap-6 items-center px-12"
          onClick={() => setActiveTab("inProgress")}
        >
          <span>In progress</span>
          <span className="badge-pill bg-paper text-ink fs-10 font-mono fw-700 px-6 py-2 br-xs">
            {tabCounts.inProgress}
          </span>
        </PillButton>

        <PillButton
          size="sm"
          tone={activeTab === "completed" ? "lime" : "white"}
          className="fw-700 row gap-6 items-center px-12"
          onClick={() => setActiveTab("completed")}
        >
          <span>Completed</span>
          <span className="badge-pill bg-paper text-ink fs-10 font-mono fw-700 px-6 py-2 br-xs">
            {tabCounts.completed}
          </span>
        </PillButton>
      </div>

      {/* Task Cards List */}
      {filteredTasks.length === 0 ? (
        <Card className="text-center py-32 stack gap-8 items-center justify-center tone-paper border-ink">
          <div className="fs-24">🎉</div>
          <div className="fw-700 text-ink fs-14">You&apos;re all caught up.</div>
          <div className="fs-12 text-muted">No tasks matching your current filters or active tab.</div>
        </Card>
      ) : (
        <div className="stack gap-12">
          {filteredTasks.map((t) => (
            <InboxCard key={t.id} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
