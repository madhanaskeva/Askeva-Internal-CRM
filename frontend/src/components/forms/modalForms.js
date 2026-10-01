// Form-modal definitions — port of the original `openModal` defaults and `fieldSets`.
// Each kind: { title, submit, initial(ctx), fields(ctx, form), note?(ctx) }
//   ctx = { role, data, fullData, extra, strict, modal }
// Field: { key, label, kind: text|number|date|select|area, placeholder?, options? } or { heading }.
import { ROLE_OPTIONS } from "../../data";
import { TODAY, addDays } from "../../utils/helpers/date";

const opts = (a) => a.map((v) => ({ value: v, label: v }));
const H = (heading) => ({ heading });
const F = (key, label, kind = "text", extra = {}) => ({ key, label, kind, ...extra });

const projOpts = (data) => data.projects.map((p) => ({ value: p.id, label: p.client }));
const staffOpt = (data) => [
  { value: "", label: "— select —" },
  ...(data.staff || []).filter((s) => s.status === "Active" && s.name !== "PC").map((s) => ({ value: s.name, label: `${s.name} · ${s.role}` })),
  { value: "TBD", label: "TBD" },
];
const defaultPid = ({ extra, data }) => extra.projectId || (data.projects[0] || {}).id;

export const MODAL_FORMS = {
  project: {
    title: "New project",
    submit: "Create project",
    initial: ({ data }) => ({
      client: "", code: "ASK-2026-0" + (47 + data.projects.length - 4), projectType: "Website + Admin panel", salesOwner: "", spoc: "", spocPhone: "", spocEmail: "",
      clientManager: "", clientOwner: "", billing: "Fixed", cost: "", advance: "40", terms: "40% advance · 30% on UI approval · 30% on handover", paymentConfirmed: "No",
      start: TODAY, deadline: addDays(TODAY, 45), domain: "Existing — client holds DNS", server: "Askeva-hosted", cloud: "", callTime: "11:00",
      uiLead: "", backendLead: "", tester: "", seniorDev: "", uiDays: "10", backendDays: "20", testDays: "5", pcDays: "8", dayRate: "4000",
    }),
    fields: ({ data }) => [
      H("01 · Sales handover (SOP §3)"),
      F("client", "Client name", "text", { placeholder: "e.g. Nova Retail" }),
      F("code", "Project code"),
      F("projectType", "Project type", "select", { options: opts(["Website + Admin panel", "Mobile app", "WhatsApp chatbot / automation", "CRM / ERP integration", "Custom software"]) }),
      F("salesOwner", "Sales owner", "text", { placeholder: "Who closed the deal" }),
      F("paymentConfirmed", "Payment confirmed by Sales?", "select", { options: opts(["No", "Yes"]) }),
      H("02 · Client contacts & escalation"),
      F("spoc", "Client SPOC", "text", { placeholder: "Name" }),
      F("spocPhone", "SPOC phone", "text", { placeholder: "+91" }),
      F("spocEmail", "SPOC email", "text", { placeholder: "name@client.com" }),
      F("clientManager", "Client manager (L2)"),
      F("clientOwner", "Client owner / decision-maker (L3)"),
      F("callTime", "Daily call time", "text", { placeholder: "11:00" }),
      H("03 · Commercials & budget"),
      F("billing", "Billing model", "select", { options: opts(["Fixed", "Resource"]) }),
      F("cost", "Project cost", "text", { placeholder: "₹4,80,000 or ₹1,20,000 / month" }),
      F("advance", "Advance %", "number"),
      F("terms", "Payment terms", "area"),
      F("start", "Start date", "date"),
      F("deadline", "Committed deadline", "date"),
      H("04 · Infrastructure (onboarding §4.2)"),
      F("domain", "Domain", "select", { options: opts(["Existing — client holds DNS", "New purchase by client", "New purchase by Askeva", "TBD"]) }),
      F("server", "Server", "select", { options: opts(["Askeva-hosted", "Client server (AWS)", "Client server (other)", "TBD"]) }),
      F("cloud", "Cloud elements / integrations", "text", { placeholder: "S3, payment gateway, WhatsApp API, SMS…" }),
      H("05 · Staff allocation"),
      F("uiLead", "UI / Frontend", "select", { options: staffOpt(data) }),
      F("backendLead", "Backend developer", "select", { options: staffOpt(data) }),
      F("tester", "Manual tester", "select", { options: staffOpt(data) }),
      F("seniorDev", "Senior Dev / Architect", "select", { options: staffOpt(data) }),
      H("06 · Effort budget (man-days)"),
      F("uiDays", "UI days (commitment 7–10)", "number"),
      F("backendDays", "Backend days", "number"),
      F("testDays", "Testing days", "number"),
      F("pcDays", "PC coordination days", "number"),
      F("dayRate", "Internal day rate (₹)", "number"),
    ],
  },

  task: {
    title: ({ role }) => (role === "DevOps" ? "New infra task (self-created · no acceptance)" : "New task"),
    submit: ({ role }) => (role === "DevOps" ? "Add infra task" : "Add task"),
    initial: (c) =>
      c.role === "DevOps"
        ? { projectId: defaultPid(c), title: "", assignee: "Naveen", due: TODAY, stage: "Infra", priority: "Med", opsKind: "Server provisioning" }
        : { projectId: defaultPid(c), title: "", assignee: "PC", due: TODAY, stage: "", priority: "Med", opsKind: "" },
    fields: ({ data, role }, form) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("title", "Task", "text", { placeholder: "What needs to happen" }),
      F("assignee", "Assignee", "select", { options: opts(["PC", "PM", "Rahul", "Sneha", "Farhan", "Imran", "Karthik", "Naveen", "Divya", "UI team", "Dev team", "Senior Dev", "Tester", "Client SPOC", "Sales"]) }),
      ...(role === "DevOps" || form.assignee === "Naveen"
        ? [F("opsKind", "Infra task type", "select", { options: opts(["Server provisioning", "Domain / DNS / SSL", "Backups & monitoring", "Access / credentials handover", "Deploy-linked"]) })]
        : []),
      F("due", "Due date", "date"),
      F("priority", "Priority", "select", { options: opts(["High", "Med", "Low"]) }),
    ],
  },

  followup: {
    title: "New follow-up",
    submit: "Add follow-up",
    initial: (c) => ({ projectId: defaultPid(c), type: "Client call", with: "", channel: "Call", due: TODAY, note: "", court: "us" }),
    fields: ({ data }) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("type", "Type", "select", { options: opts(["Client call", "Internal call", "WhatsApp update", "Email approval", "Reminder", "Milestone review"]) }),
      F("with", "With", "text", { placeholder: "Person or group" }),
      F("channel", "Channel", "select", { options: opts(["Call", "WhatsApp", "Email", "Meeting"]) }),
      F("due", "Due date", "date"),
      F("court", "Who owes the next action?", "select", { options: [{ value: "us", label: "Us — Askeva must respond / deliver" }, { value: "client", label: "Client — waiting on their input / approval" }] }),
      F("note", "Note / agenda", "area"),
    ],
  },

  communication: {
    title: "New client communication",
    submit: "Log communication",
    initial: (c) => ({ projectId: defaultPid(c), channel: "WhatsApp", recipient: "", type: "Daily Call MoM", message: "", court: "client" }),
    fields: ({ data }) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("channel", "Channel", "select", { options: opts(["WhatsApp", "Email", "Call", "Meeting"]) }),
      F("recipient", "Recipient / SPOC", "text", { placeholder: "e.g. Priya Menon" }),
      F("type", "Type / Topic", "select", { options: opts(["Daily Call MoM", "CR Discussion", "Requirement Signoff", "Payment Reminder", "Milestone Update", "Escalation"]) }),
      F("court", "Who owes next action?", "select", { options: [{ value: "client", label: "Client owes response" }, { value: "us", label: "We (Askeva) owe response" }] }),
      F("message", "Communication / MoM notes", "area"),
    ],
  },

  cr: {
    title: "Change request",
    submit: "Log CR",
    initial: (c) => ({ projectId: defaultPid(c), title: "", kind: "New requirement", cost: "", timeline: "" }),
    fields: ({ data }) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("title", "Request", "text", { placeholder: "What the client asked for" }),
      F("kind", "Classification", "select", { options: opts(["New requirement", "Correction"]) }),
      F("cost", "Cost estimate", "text", { placeholder: "₹ or —" }),
      F("timeline", "Timeline impact", "text", { placeholder: "+N days" }),
    ],
  },

  expense: {
    title: "Log expense",
    submit: "Add expense",
    initial: (c) => ({ projectId: defaultPid(c), date: TODAY, category: "Server / hosting", desc: "", amount: "" }),
    fields: ({ data }) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("date", "Date", "date"),
      F("category", "Category", "select", { options: opts(["Server / hosting", "Domain / SSL", "Third-party API", "Software / licences", "Travel / onsite", "Freelancer / outsourcing", "Other"]) }),
      F("desc", "Description", "text", { placeholder: "What was paid for" }),
      F("amount", "Amount (₹)", "number"),
    ],
  },

  invoice: {
    title: "Invoice / payment",
    submit: "Add invoice",
    initial: (c) => ({ projectId: defaultPid(c), date: TODAY, label: "", amount: "", status: "Due" }),
    fields: ({ data }) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("label", "Label", "text", { placeholder: "e.g. 30% on UI approval" }),
      F("amount", "Amount (₹)", "number"),
      F("date", "Due / paid date", "date"),
      F("status", "Status", "select", { options: opts(["Due", "Received"]) }),
    ],
  },

  effort: {
    title: "Log effort",
    submit: "Add days",
    initial: (c) => ({ projectId: defaultPid(c), role: "ui", days: "1", crId: "" }),
    note: ({ strict }) =>
      strict
        ? "Effort against a CR that is not Approved is blocked (no email = no work). Log it under Core scope only if it is genuinely contracted work."
        : "strictGates is off — effort on unapproved CRs is allowed but flagged red.",
    fields: ({ data }, form) => [
      F("projectId", "Project", "select", { options: projOpts(data) }),
      F("role", "Role", "select", { options: [{ value: "ui", label: "UI / Frontend" }, { value: "backend", label: "Backend" }, { value: "tester", label: "Manual tester" }, { value: "pc", label: "Project Coordinator" }] }),
      F("days", "Days worked", "number"),
      F("crId", "Work is for", "select", {
        options: [{ value: "", label: "Core scope (contracted)" }, ...data.crs.filter((c) => c.projectId === form.projectId).map((c) => ({ value: c.id, label: `${c.id} · ${c.title} · ${c.status}` }))],
      }),
    ],
  },

  revise: {
    title: "Deadline revision",
    submit: "Submit for PM approval",
    initial: (c) => ({ projectId: defaultPid(c), to: c.extra.to || "", reason: "", category: "Approved CR extension" }),
    note: () => "The original committed deadline stays as the baseline. The new date only takes effect once the PM approves this revision; until then health is judged against the current deadline.",
    fields: () => [
      F("to", "New deadline", "date"),
      F("category", "Reason category", "select", { options: opts(["Approved CR extension", "Client delay (inputs / approvals)", "Internal resource unavailability", "Underestimated scope", "Third-party dependency", "Other"]) }),
      F("reason", "Explanation for PM", "area"),
    ],
  },

  overrun: {
    title: "Budget overrun — reason",
    submit: "Log reason",
    initial: (c) => ({ projectId: defaultPid(c), category: "Rework / bugs", note: "" }),
    note: () => "Actual staff cost has crossed the planned budget. The alert stays on the dashboard until a reason is logged and the PM acknowledges it.",
    fields: () => [
      F("category", "Cause", "select", { options: opts(["Rework / bugs", "Unapproved scope creep", "Estimate error", "Client delay caused idle time", "Resource change / onboarding", "Other"]) }),
      F("note", "What happened and what changes now", "area"),
    ],
  },

  bug: {
    title: "Log bug · fail task",
    submit: "Raise bug & mark Failed",
    initial: ({ extra }) => ({ severity: "High", module: "", desc: "", evidence: "", developer: extra.assignee || "" }),
    note: () => "A tester cannot fail a task without a bug. The bug is linked to the task, the task moves to Failed, and it cannot Pass until this bug is Verified.",
    fields: () => [
      F("severity", "Severity", "select", { options: opts(["Critical", "High", "Medium", "Low"]) }),
      F("module", "Module", "text", { placeholder: "e.g. Auth / Login, Checkout, Reports" }),
      F("desc", "What is wrong", "text", { placeholder: "e.g. Login API returns 500 on wrong password" }),
      F("evidence", "Evidence — screenshot / log reference", "text", { placeholder: "Link, filename or log timestamp" }),
      F("developer", "Developer to fix", "text"),
    ],
  },

  staff: {
    title: "Add employee",
    submit: "Add employee",
    initial: () => ({ name: "", role: "UI / Frontend", dept: "Design", salary: "", allowances: "0", workDays: "22", joined: TODAY }),
    fields: () => [
      F("name", "Full name", "text", { placeholder: "Employee name" }),
      F("role", "Role", "select", { options: opts(["UI / Frontend", "Backend", "Manual tester", "Senior Dev / Architect", "DevOps", "Project Coordinator", "Project Manager", "Sales"]) }),
      F("dept", "Department", "select", { options: opts(["Design", "Engineering", "QA", "Delivery", "Sales", "Management"]) }),
      F("salary", "Monthly basic salary (₹)", "number"),
      F("allowances", "Monthly allowances (₹)", "number"),
      F("workDays", "Working days / month", "number"),
      F("joined", "Joining date", "date"),
    ],
  },

  staffFull: {
    title: ({ extra }) => (extra.staff ? "Edit staff record · " + extra.staff.name : "Add staff member"),
    submit: ({ extra }) => (extra.staff ? "Save record" : "Add to team"),
    initial: ({ extra }) => {
      const s = extra.staff;
      if (s) {
        const str = (v) => (v == null ? "" : String(v));
        return { ...s, salary: str(s.salary), allowances: str(s.allowances), workDays: str(s.workDays), reportsTo: s.reportsTo || "" };
      }
      return { name: "", role: "UI / Frontend", dept: "Design", email: "", phone: "", emergency: "", address: "", idNo: "", pan: "", bank: "", salary: "", allowances: "", workDays: "22", joined: TODAY, reportsTo: "", notes: "" };
    },
    fields: ({ role, fullData, extra }) => [
      H("01 · Identity"),
      F("name", "Full name", "text", { placeholder: "Employee name" }),
      F("idNo", "Employee ID", "text", { placeholder: "ASK-1xx" }),
      F("role", "Role", "select", { options: opts(ROLE_OPTIONS.filter((r) => r !== "Admin" || role === "SuperAdmin")) }),
      F("dept", "Department", "select", { options: opts(["Design", "Engineering", "QA", "Delivery", "Sales", "Management"]) }),
      F("reportsTo", "Reports to", "select", {
        options: [
          { value: "", label: "— none —" },
          ...(fullData.staff || []).filter((x) => ["Admin", "Project Manager", "Project Coordinator"].includes(x.role) && x.id !== extra.staff?.id).map((x) => ({ value: x.id, label: x.name + " · " + x.role })),
        ],
      }),
      H("02 · Contact"),
      F("email", "Work email", "text", { placeholder: "name@askeva.in" }),
      F("phone", "Phone", "text", { placeholder: "+91" }),
      F("emergency", "Emergency contact", "text", { placeholder: "Name · phone" }),
      F("address", "Address", "area"),
      H("03 · Compensation & compliance"),
      F("salary", "Monthly basic salary (₹)", "number"),
      F("allowances", "Monthly allowances (₹)", "number"),
      F("workDays", "Working days / month", "number"),
      F("joined", "Joining date", "date"),
      F("pan", "PAN", "text"),
      F("bank", "Bank account · IFSC", "text"),
      F("notes", "HR notes", "area"),
    ],
  },

  payAdjust: {
    title: "Adjust payslip",
    submit: "Save",
    initial: ({ extra }) => ({ bonus: String(extra.entry?.bonus ?? 0), deductions: String(extra.entry?.deductions ?? 0), note: extra.entry?.note || "" }),
    fields: () => [
      F("bonus", "Bonus / incentive (₹)", "number"),
      F("deductions", "Deductions — PF, TDS, leave (₹)", "number"),
      F("note", "Note", "text", { placeholder: "e.g. 2 days LOP" }),
    ],
  },
};

/** Resolve a value that may be a function of the modal context. */
export const resolve = (v, c) => (typeof v === "function" ? v(c) : v);
