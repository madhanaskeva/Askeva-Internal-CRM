// Schema migrations — a faithful port of the original constructor. Each block is
// idempotent and guarded by a flag/field check, so existing saved data from the
// HTML version keeps working and only missing pieces are filled in.
import { DEFAULT_RULES, payroll as seedPayroll, projectFinance, projectTeams, releases as seedReleases, staff as seedStaff } from "../../data";
import { defaultMilestones, seed } from "./seed";
import { TODAY, addDays } from "../helpers/date";
import { uid } from "../helpers/format";
import { needsAccept, trackOf } from "../domain/tasks";

const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");

/** Mutates `data` in place. Returns true when anything changed (caller persists). */
export function migrateData(data) {
  let migrated = false;

  if (!data.clientCommunications) {
    migrated = true;
    data.clientCommunications = seed().clientCommunications;
  }

  data.projects.forEach((p) => {
    if (!p.milestones) {
      migrated = true;
      p.milestones = defaultMilestones(p.start);
      const doneUpTo = p.stage >= 7 ? 7 : p.stage >= 6 ? 6 : p.stage >= 5 ? 4 : p.stage >= 4 ? 2 : p.stage >= 1 ? 1 : 0;
      p.milestones.forEach((m, i) => { if (i < doneUpTo) m.actual = m.target; });
    }
    if (!p.deadline) { migrated = true; p.deadline = p.milestones[6].target; }
    if (p.uiStart === undefined) { migrated = true; p.uiStart = p.stage >= 4 ? addDays(p.start, 3) : null; }
  });

  data.projects.forEach((p) => {
    if (!p.team) {
      migrated = true;
      const s = projectTeams[p.id] || { team: { ui: "TBD", backend: "TBD", tester: "TBD", seniorDev: "TBD" }, budget: { uiDays: 0, backendDays: 0, testDays: 0, pcDays: 0, dayRate: 4000 } };
      p.team = structuredClone(s.team);
      p.budget = structuredClone(s.budget);
    }
  });

  data.projects.forEach((p) => {
    if (!p.invoices) {
      migrated = true;
      const s = projectFinance[p.id] || { invoices: [], expenses: [], effort: { ui: 0, backend: 0, tester: 0, pc: 0 } };
      p.invoices = structuredClone(s.invoices);
      p.expenses = structuredClone(s.expenses);
      p.effort = structuredClone(s.effort);
    }
  });

  if (!data.staff) {
    migrated = true;
    data.staff = structuredClone(seedStaff);
    data.payroll = structuredClone(seedPayroll);
  }

  data.projects.forEach((p) => {
    if (!p.baselineDeadline) {
      migrated = true;
      p.baselineDeadline = p.deadline;
      p.revisions = [];
      p.overrides = [];
      p.overrun = null;
      p.effortLog = [];
    }
  });

  data.followups.forEach((f) => {
    if (!f.court) { migrated = true; f.court = f.type === "Email approval" || f.type === "Reminder" ? "client" : "us"; }
  });

  data.tasks.forEach((t) => {
    if (t.history) return;
    migrated = true;
    if (t.status === "done") t.status = "closed";
    t.owner = t.owner || "PC";
    t.createdBy = "PC";
    t.blocked = false;
    const created = addDays(t.due, -4);
    t.history = [{ date: created, actor: "PC", role: "PC", from: null, to: "todo", note: "Task created · assigned to " + t.assignee }];
    if (t.status === "doing") t.history.push({ date: addDays(t.due, -2), actor: t.assignee, role: "Assignee", from: "todo", to: "doing", note: "" });
    if (t.status === "closed") {
      t.history.push(
        { date: addDays(t.due, -3), actor: t.assignee, role: "Assignee", from: "todo", to: "doing", note: "" },
        { date: addDays(t.due, -1), actor: t.assignee, role: "Assignee", from: "doing", to: "devdone", note: "" },
        { date: addDays(t.due, -1), actor: "Divya", role: "Tester", from: "devdone", to: "testing", note: "" },
        { date: t.due, actor: "Divya", role: "Tester", from: "testing", to: "passed", note: "Verified against approval email" },
        { date: t.due, actor: "PC", role: "PC", from: "passed", to: "closed", note: "" },
      );
      t.completedOn = addDays(t.due, -1);
      t.closedOn = t.due;
    }
  });

  if (!data.bugs) {
    migrated = true;
    data.bugs = [];
    const t6 = data.tasks.find((t) => t.id === "t6");
    if (t6) {
      t6.status = "rework";
      t6.history.push(
        { date: "2026-09-14", actor: "Farhan", role: "Assignee", from: "doing", to: "devdone", note: "" },
        { date: "2026-09-15", actor: "Divya", role: "Tester", from: "devdone", to: "testing", note: "" },
        { date: "2026-09-15", actor: "Divya", role: "Tester", from: "testing", to: "failed", note: "BUG-001 · Login API returns 500 on wrong password" },
        { date: "2026-09-16", actor: "Farhan", role: "Assignee", from: "failed", to: "rework", note: "Root cause: null check on user lookup" },
      );
      t6.completedOn = "2026-09-14";
      data.bugs.push({ id: "BUG-001", taskId: "t6", projectId: "p3", severity: "High", desc: "Login API returns 500 instead of 401 on wrong password", evidence: "Postman screenshot · staging log 15 Sep 14:02", developer: "Farhan", tester: "Divya", status: "Open", raised: "2026-09-15", fixed: null, retest: null, result: "", history: [{ date: "2026-09-15", actor: "Divya", role: "Tester", to: "Open", note: "Raised during round 2" }] });
    }
  }

  if (!data.v2seed) {
    migrated = true;
    data.v2seed = true;
    const H = (created, steps) => [
      { date: created, actor: "PC", role: "PC", from: null, to: "todo", note: "Task created" },
      ...steps.map(([date, actor, role, from, to, note]) => ({ date, actor, role, from, to, note: note || "" })),
    ];
    const T = (id, projectId, title, assignee, due, stage, status, priority, history, extra = {}) => ({ id, projectId, title, assignee, due, stage, status, priority, owner: "PC", createdBy: "PC", blocked: false, history, track: trackOf({ assignee }), ...extra });
    data.tasks.push(
      T("t10", "p1", "Build batch 2 screens — product listing & cart", "Rahul", "2026-09-17", "UI", "doing", "High", H("2026-09-12", [["2026-09-14", "Rahul", "Assignee", "todo", "doing"]])),
      T("t11", "p1", "Header colour correction per approved design system (CR-002)", "Rahul", "2026-09-16", "UI", "devdone", "Med", H("2026-09-13", [["2026-09-14", "Rahul", "Assignee", "todo", "doing"], ["2026-09-15", "Rahul", "Assignee", "doing", "devdone"]]), { completedOn: "2026-09-15" }),
      T("t12", "p1", "Checkout & order confirmation screens", "Rahul", "2026-09-19", "UI", "todo", "Med", H("2026-09-15", [])),
      T("t13", "p3", "Payment gateway sandbox integration", "Imran", "2026-09-14", "Backend", "failed", "High", H("2026-09-08", [["2026-09-09", "Imran", "Assignee", "todo", "doing"], ["2026-09-13", "Imran", "Assignee", "doing", "devdone"], ["2026-09-14", "Divya", "Tester", "devdone", "testing"], ["2026-09-15", "Divya", "Tester", "testing", "failed", "BUG-002 · Failed transaction marked as paid"]]), { completedOn: "2026-09-13" }),
      T("t14", "p3", "Attendance report API + Excel export endpoint", "Imran", "2026-09-16", "Backend", "devdone", "Med", H("2026-09-11", [["2026-09-12", "Imran", "Assignee", "todo", "doing"], ["2026-09-16", "Imran", "Assignee", "doing", "devdone"]]), { completedOn: "2026-09-16" }),
      T("t15", "p3", "Role-based access for admin panel", "Farhan", "2026-09-15", "Backend", "testing", "High", H("2026-09-09", [["2026-09-10", "Farhan", "Assignee", "todo", "doing"], ["2026-09-13", "Farhan", "Assignee", "doing", "devdone"], ["2026-09-14", "Divya", "Tester", "devdone", "testing"], ["2026-09-14", "Divya", "Tester", "testing", "failed", "BUG-003 · Admin can delete super-admin"], ["2026-09-15", "Farhan", "Assignee", "failed", "rework", "Added role hierarchy check"], ["2026-09-16", "Farhan", "Assignee", "rework", "devdone"], ["2026-09-16", "Divya", "Tester", "devdone", "testing"]]), { completedOn: "2026-09-16" }),
      T("t16", "p3", "Fee reminder cron job (WhatsApp template)", "Farhan", "2026-09-14", "Backend", "passed", "Med", H("2026-09-06", [["2026-09-07", "Farhan", "Assignee", "todo", "doing"], ["2026-09-11", "Farhan", "Assignee", "doing", "devdone"], ["2026-09-12", "Divya", "Tester", "devdone", "testing"], ["2026-09-12", "Divya", "Tester", "testing", "failed", "BUG-005 · Reminder sent twice"], ["2026-09-13", "Farhan", "Assignee", "failed", "rework"], ["2026-09-14", "Farhan", "Assignee", "rework", "devdone"], ["2026-09-15", "Divya", "Tester", "devdone", "testing"], ["2026-09-16", "Divya", "Tester", "testing", "passed", "Retest passed · BUG-005 verified"]]), { completedOn: "2026-09-14" }),
      T("t17", "p2", "Design system draft — colours, type, components", "Sneha", "2026-09-19", "UI", "doing", "High", H("2026-09-15", [["2026-09-15", "Sneha", "Assignee", "todo", "doing"], ["2026-09-16", "Sneha", "Assignee", "doing", "doing", "BLOCKED — Brand colours and logo files not received from client"]]), { blocked: true }),
      T("t18", "p3", "Round 3 regression on staging (manual test doc)", "Divya", "2026-09-18", "Backend", "todo", "High", H("2026-09-16", [])),
    );
    const B = (id, taskId, projectId, severity, desc, evidence, developer, module, status, raised, extra = {}) => ({ id, taskId, projectId, severity, desc, evidence, developer, tester: "Divya", module, status, raised, fixed: null, retest: null, result: "", history: [{ date: raised, actor: "Divya", role: "Tester", to: "Open", note: "Raised during testing" }], ...extra });
    data.bugs.push(
      B("BUG-002", "t13", "p3", "Critical", "Failed transaction is marked as paid — payment callback signature not verified", "Sandbox txn #8812 · staging log 15 Sep 11:40", "Imran", "Payments", "Open", "2026-09-15"),
      B("BUG-003", "t15", "p3", "Medium", "Admin role can delete the super-admin account", "Screen recording · admin panel > users", "Farhan", "Admin / Roles", "Fixed", "2026-09-14", { fixed: "2026-09-16", history: [{ date: "2026-09-14", actor: "Divya", role: "Tester", to: "Open", note: "Raised during testing" }, { date: "2026-09-16", actor: "Farhan", role: "Backend", to: "Fixed", note: "Role hierarchy check added on delete" }] }),
      B("BUG-004", "t11", "p1", "Low", "Header green differs from approved design system by ~2%", "Side-by-side screenshot vs Figma", "Rahul", "UI / Header", "Rejected", "2026-09-15", { history: [{ date: "2026-09-15", actor: "Divya", role: "Tester", to: "Open", note: "Raised during PC review" }, { date: "2026-09-16", actor: "Rahul", role: "Frontend", to: "Rejected", note: "Colour matches approved token #3DC838; difference is monitor calibration" }] }),
      B("BUG-005", "t16", "p3", "Medium", "Fee reminder sent twice to the same parent", "WhatsApp log · 2 messages 12 Sep 09:00", "Farhan", "Notifications", "Verified", "2026-09-12", { fixed: "2026-09-14", retest: "2026-09-15", closedOn: "2026-09-16", result: "Passed retest", history: [{ date: "2026-09-12", actor: "Divya", role: "Tester", to: "Open", note: "Raised during testing" }, { date: "2026-09-14", actor: "Farhan", role: "Backend", to: "Fixed", note: "Idempotency key on job run" }, { date: "2026-09-15", actor: "Divya", role: "Tester", to: "Retest", note: "" }, { date: "2026-09-16", actor: "Divya", role: "Tester", to: "Verified", note: "Single message observed over 2 runs" }] }),
    );
    data.projects.forEach((p) => { if (!p.effortLog) p.effortLog = []; });
    const p1 = data.projects.find((p) => p.id === "p1");
    const p3 = data.projects.find((p) => p.id === "p3");
    if (p1) p1.effortLog.push({ id: "el" + uid(), date: "2026-09-16", role: "ui", days: 1, note: "Batch 2 screens" }, { id: "el" + uid(), date: "2026-09-16", role: "pc", days: 1, note: "PC review + client call" });
    if (p3) p3.effortLog.push({ id: "el" + uid(), date: "2026-09-16", role: "backend", days: 1, note: "Attendance API" }, { id: "el" + uid(), date: "2026-09-16", role: "tester", days: 1, note: "Retest BUG-005, RBAC testing" });
  }

  data.tasks.forEach((t) => { if (!t.track) { migrated = true; t.track = trackOf(t); } });

  if (!data.v2qa) {
    migrated = true;
    data.v2qa = true;
    // Back-fill deterministic event times so the QA timelines have content.
    data.tasks.forEach((t, ti) => {
      (t.history || []).forEach((x, i) => {
        if (x.time) return;
        let m = 9 * 60 + ((ti * 31 + i * 47) % 400);
        if (i > 0 && t.history[i - 1].date === x.date) {
          const [ph, pm] = (t.history[i - 1].time || "09:00").split(":").map(Number);
          m = Math.max(m, ph * 60 + pm + 8 + ((i * 13) % 40));
        }
        x.time = hhmm(Math.min(m, 18 * 60 + 30));
      });
    });
    data.bugs.forEach((b, bi) => {
      (b.history || []).forEach((x, i) => {
        if (x.time) return;
        let m = 9 * 60 + ((bi * 29 + i * 61) % 420);
        if (i > 0 && b.history[i - 1].date === x.date) {
          const [ph, pm] = (b.history[i - 1].time || "09:00").split(":").map(Number);
          m = Math.max(m, ph * 60 + pm + 25 + ((i * 17) % 90));
        }
        x.time = hhmm(Math.min(m, 18 * 60 + 30));
      });
      const f = (b.history || []).find((x) => x.to === "Open");
      if (f) b.raisedTime = f.time;
      const fx = (b.history || []).filter((x) => x.to === "Fixed").pop();
      if (fx) b.fixedTime = fx.time;
      const rt = (b.history || []).filter((x) => x.to === "Retest").pop();
      if (rt) b.retestTime = rt.time;
      const v = (b.history || []).filter((x) => x.to === "Verified" || x.to === "NotABug").pop();
      if (v) b.closedTime = v.time;
    });
    // Give today's demo a few tester events so the dashboard has content.
    const t15 = data.tasks.find((t) => t.id === "t15");
    if (t15 && t15.status === "testing") {
      t15.history.push({ date: TODAY, time: "10:05", actor: "Divya", role: "Tester", from: "testing", to: "passed", note: "RBAC hierarchy verified on staging · BUG-003 verified" });
      t15.status = "passed";
      const b3 = data.bugs.find((b) => b.id === "BUG-003");
      if (b3 && b3.status === "Fixed") {
        b3.history.push({ date: TODAY, time: "09:40", actor: "Divya", role: "Tester", to: "Retest", note: "" }, { date: TODAY, time: "09:58", actor: "Divya", role: "Tester", to: "Verified", note: "Super-admin delete blocked for admin role" });
        Object.assign(b3, { fixedTime: "16:20", retest: TODAY, retestTime: "09:40", status: "Verified", result: "Passed retest", closedOn: TODAY, closedTime: "09:58" });
      }
    }
    const t14 = data.tasks.find((t) => t.id === "t14");
    if (t14 && t14.status === "devdone") {
      t14.history.push({ date: TODAY, time: "11:20", actor: "Divya", role: "Tester", from: "devdone", to: "testing", note: "" }, { date: TODAY, time: "11:52", actor: "Divya", role: "Tester", from: "testing", to: "failed", note: "BUG-006 · Excel export drops rows with unicode names" });
      t14.status = "failed";
      data.bugs.push({ id: "BUG-006", taskId: "t14", projectId: "p3", severity: "High", desc: "Excel export drops rows where student name has unicode characters", evidence: "export_1152.xlsx · 3 rows missing vs UI count", developer: "Imran", tester: "Divya", module: "Reports", status: "Open", raised: TODAY, raisedTime: "11:52", fixed: null, retest: null, result: "", history: [{ date: TODAY, time: "11:52", actor: "Divya", role: "Tester", to: "Open", note: "Raised during testing" }] });
    }
    const t11 = data.tasks.find((t) => t.id === "t11");
    if (t11 && t11.status === "devdone") {
      t11.history.push({ date: TODAY, time: "14:10", actor: "Divya", role: "Tester", from: "devdone", to: "testing", note: "" }, { date: TODAY, time: "14:35", actor: "Divya", role: "Tester", from: "testing", to: "passed", note: "Header token matches design system on 3 breakpoints" });
      t11.status = "passed";
      const b4 = data.bugs.find((b) => b.id === "BUG-004");
      if (b4 && b4.status === "Rejected") {
        b4.history.push({ date: TODAY, time: "14:30", actor: "Divya", role: "Tester", to: "NotABug", note: "Agreed — calibration difference" });
        Object.assign(b4, { status: "Verified", notABug: true, result: "Rejected — not a bug (tester agreed)", closedOn: TODAY, closedTime: "14:30" });
      }
    }
  }

  {
    const b3 = (data.bugs || []).find((b) => b.id === "BUG-003");
    if (b3 && b3.fixed && b3.retest && b3.fixedTime && b3.retestTime && b3.fixed === b3.retest && b3.fixedTime > b3.retestTime) {
      migrated = true;
      b3.fixedTime = "09:05";
    }
  }

  if (!data.v2admin) {
    migrated = true;
    data.v2admin = true;
    data.staff = data.staff || [];
    const ensure = (s) => { if (!data.staff.some((x) => x.name === s.name)) data.staff.push({ id: "s" + uid(), status: "Active", workDays: 22, ...s }); };
    ensure({ name: "Anita", role: "Project Manager", dept: "Delivery", salary: 120000, allowances: 10000, joined: "2024-01-08", email: "anita@askeva.in", phone: "+91 98400 11001" });
    ensure({ name: "Vikram", role: "Project Manager", dept: "Delivery", salary: 110000, allowances: 8000, joined: "2025-04-01", email: "vikram@askeva.in", phone: "+91 98400 11002" });
    ensure({ name: "Meera", role: "Admin", dept: "Management", salary: 150000, allowances: 12000, joined: "2023-06-01", email: "meera@askeva.in", phone: "+91 98400 11000" });
    ensure({ name: "Naveen", role: "DevOps", dept: "Engineering", salary: 60000, allowances: 8000, joined: "2025-11-03" });
    const by = (n) => (data.staff.find((s) => s.name === n) || {}).id;
    const anita = by("Anita"), vikram = by("Vikram"), pc = by("PC"), meera = by("Meera");
    data.staff.forEach((s) => {
      if (s.reportsTo) return;
      if (s.role === "Admin") s.reportsTo = null;
      else if (s.role === "Project Manager") s.reportsTo = meera;
      else if (s.role === "Project Coordinator") s.reportsTo = anita;
      else s.reportsTo = pc;
    });
    data.staff.forEach((s) => {
      s.email = s.email || s.name.toLowerCase().replace(/[^a-z]/g, "") + "@askeva.in";
      s.phone = s.phone || "";
      s.emergency = s.emergency || "";
      s.address = s.address || "";
      s.idNo = s.idNo || "ASK-" + String(100 + data.staff.indexOf(s)).padStart(3, "0");
      s.bank = s.bank || "";
      s.pan = s.pan || "";
      s.notes = s.notes || "";
    });
    data.projects.forEach((p, i) => { if (!p.pmId) p.pmId = i % 3 === 2 ? vikram : anita; });
    data.rules = { ...DEFAULT_RULES };
    data.clientAccounts = data.projects.map((p) => ({
      id: "c" + uid(),
      projectId: p.id,
      name: p.spoc,
      email: p.spocEmail || p.spoc.toLowerCase().replace(/[^a-z]/g, ".") + "@" + p.client.toLowerCase().replace(/[^a-z]/g, "") + ".com",
      phone: p.spocPhone || "",
      status: "Active",
      lastLogin: "2026-09-15",
    }));
    data.syslog = [{ ts: Date.now() - 86400000, date: "2026-09-16", actor: "Super admin", role: "SuperAdmin", view: "settings", label: "System rules initialised" }];
  }

  if (!data.v2ops) {
    migrated = true;
    data.v2ops = true;
    data.tasks.push(
      { id: "t21", projectId: "p1", title: "Provision production server + SSL for novaretail domain", assignee: "Naveen", track: "devops", opsKind: "Server provisioning", owner: "PC", createdBy: "PC", due: "2026-09-19", stage: "Infra", status: "doing", priority: "High", blocked: false, acceptance: "accepted", assignedOn: "2026-09-15", assignedBy: "PC", acceptedOn: "2026-09-15", history: [{ date: "2026-09-15", actor: "PC", role: "PC", from: null, to: "todo", note: "Task created · assigned to Naveen" }, { date: "2026-09-15", actor: "Naveen", role: "Assignee", from: "todo", to: "todo", note: "ACCEPTED — task accepted" }, { date: "2026-09-16", actor: "Naveen", role: "Assignee", from: "todo", to: "doing" }] },
      { id: "t22", projectId: "p3", title: "Nightly DB backup + uptime monitoring on staging", assignee: "Naveen", track: "devops", opsKind: "Backups & monitoring", owner: "PC", createdBy: "Naveen", due: "2026-09-18", stage: "Infra", status: "todo", priority: "Med", blocked: false, selfCreated: true, history: [{ date: "2026-09-16", actor: "Naveen", role: "DevOps", from: null, to: "todo", note: "Self-created infra task" }] },
      { id: "t23", projectId: "p3", title: "Deploy REL-002 v0.6.3 to staging", assignee: "Naveen", track: "devops", opsKind: "Deploy-linked", releaseId: "REL-002", owner: "PC", createdBy: "Imran", due: "2026-09-16", stage: "Infra", status: "todo", priority: "Med", blocked: false, selfCreated: true, history: [{ date: "2026-09-16", actor: "Imran", role: "Backend", from: null, to: "todo", note: "Auto-created from staging request REL-002" }] },
      { id: "t24", projectId: "p2", title: "Handover of server credentials & DNS access to client IT", assignee: "Naveen", track: "devops", opsKind: "Access / credentials handover", owner: "PC", createdBy: "PC", due: "2026-09-20", stage: "Infra", status: "todo", priority: "Low", blocked: false, acceptance: "pending", assignedOn: "2026-09-17", assignedBy: "PC", history: [{ date: "2026-09-17", actor: "PC", role: "PC", from: null, to: "todo", note: "Task created · assigned to Naveen" }] },
    );
    if (data.staff && !data.staff.some((s) => s.name === "Naveen")) {
      data.staff.push({ id: "s" + uid(), name: "Naveen", role: "DevOps", dept: "Engineering", salary: 60000, allowances: 8000, workDays: 22, joined: "2025-11-03", status: "Active" });
    }
  }

  if (!data.releases) {
    migrated = true;
    data.releases = structuredClone(seedReleases);
  }

  if (!data.v2alloc) {
    migrated = true;
    data.v2alloc = true;
    data.tasks.forEach((t) => {
      if (!needsAccept(t)) return;
      const created = (t.history[0] || {}).date || TODAY;
      t.assignedOn = created;
      t.assignedBy = "PC";
      if (t.status === "todo" && ["t12"].includes(t.id)) {
        t.acceptance = "pending";
      } else {
        t.acceptance = "accepted";
        t.acceptedOn = addDays(created, 0);
        t.history.splice(1, 0, { date: created, actor: t.assignee, role: "Assignee", from: "todo", to: "todo", note: "ACCEPTED — task accepted" });
      }
    });
    const t12 = data.tasks.find((t) => t.id === "t12");
    if (t12) t12.assignedOn = "2026-09-15";
    data.tasks.push(
      { id: "t19", projectId: "p1", title: "Product filter sidebar (category, price, brand)", assignee: "Unassigned", track: "frontend", owner: "PC", createdBy: "PC", due: "2026-09-20", stage: "UI", status: "todo", priority: "Med", blocked: false, acceptance: "declined", declinedBy: "Rahul", assignedOn: "2026-09-15", history: [{ date: "2026-09-15", actor: "PC", role: "PC", from: null, to: "todo", note: "Task created · assigned to Rahul" }, { date: "2026-09-16", actor: "Rahul", role: "Assignee", from: "todo", to: "todo", note: "DECLINED — Already on batch 2 + CR-002 until 17 Sep; cannot take a third UI task this week" }] },
      { id: "t20", projectId: "p3", title: "Bulk student import (CSV) with validation report", assignee: "Imran", track: "backend", owner: "PC", createdBy: "PC", due: "2026-09-19", stage: "Backend", status: "todo", priority: "Med", blocked: false, acceptance: "pending", assignedOn: "2026-09-16", assignedBy: "Farhan", handover: { from: "Farhan", to: "Imran", date: "2026-09-16", note: "Tied up on RBAC retest + fee cron; Imran already owns the attendance import code", ack: false }, history: [{ date: "2026-09-14", actor: "PC", role: "PC", from: null, to: "todo", note: "Task created · assigned to Farhan" }, { date: "2026-09-14", actor: "Farhan", role: "Assignee", from: "todo", to: "todo", note: "ACCEPTED — task accepted" }, { date: "2026-09-16", actor: "Farhan", role: "Assignee", from: "todo", to: "todo", note: "HANDOVER — Farhan → Imran · Tied up on RBAC retest + fee cron; Imran already owns the attendance import code" }] },
    );
  }

  data.bugs.forEach((b) => { if (!b.module) { migrated = true; b.module = b.taskId === "t6" ? "Auth / Login" : "General"; } });
  data.projects.forEach((p) => p.milestones.forEach((m) => { if (!m.comments) { migrated = true; m.comments = []; } }));
  if (!data.signoffs) { migrated = true; data.signoffs = {}; }

  return migrated;
}
