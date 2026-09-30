// Demo seed data — identical to the original Internal CRM `seed()` and the
// per-migration seed blocks, so a fresh browser shows the same demo portfolio.
import { GATES, MS } from "../constants/crm";
import { addDays } from "../utils/date";

export const defaultMilestones = (start, offsets = [1, 3, 10, 14, 32, 40, 45]) =>
  MS.map((name, i) => ({ id: "M" + (i + 1), name, target: addDays(start, offsets[i]), actual: null }));

/** Gate map with the first `keys` items of gate `n` ticked. */
const g = (n, keys) => {
  const o = {};
  GATES[n].items.forEach(([k], i) => (o[k] = i < keys));
  return o;
};

export function seed() {
  return {
    projects: [
      { id: "p1", code: "ASK-2026-041", client: "Nova Retail", spoc: "Priya Menon", clientManager: "R. Iyer", clientOwner: "S. Nair", billing: "Fixed", stage: 4, salesOwner: "Arjun", start: "2026-09-02", cost: "₹4,80,000", payments: "Advance 40% received · 30% on UI · 30% on handover", server: "Askeva-hosted", callTime: "11:00 daily", redesigns: 1, deadline: "2026-10-20", uiStart: "2026-09-05", milestones: [{ id: "M1", name: MS[0], target: "2026-09-03", actual: "2026-09-03" }, { id: "M2", name: MS[1], target: "2026-09-07", actual: "2026-09-08" }, { id: "M3", name: MS[2], target: "2026-09-17", actual: null }, { id: "M4", name: MS[3], target: "2026-09-21", actual: null }, { id: "M5", name: MS[4], target: "2026-10-08", actual: null }, { id: "M6", name: MS[5], target: "2026-10-15", actual: null }, { id: "M7", name: MS[6], target: "2026-10-20", actual: null }], gates: { 0: g(0, 5), 1: g(1, 10), 2: g(2, 4), 3: g(3, 3), 4: g(4, 2), 5: {}, 6: {} } },
      { id: "p2", code: "ASK-2026-044", client: "Medico Plus", spoc: "Dr. Anand", clientManager: "K. Rao", clientOwner: "Dr. Anand", billing: "Resource", stage: 1, salesOwner: "Meera", start: "2026-09-14", cost: "₹1,20,000 / month", payments: "Monthly resource billing · Sept paid", server: "Client server (AWS)", callTime: "16:00 daily", redesigns: 0, gates: { 0: g(0, 5), 1: { domain: true, server: true, spoc: true, waGroup: true }, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} } },
      { id: "p3", code: "ASK-2026-038", client: "EduSpark", spoc: "Vikram S.", clientManager: "L. Das", clientOwner: "Vikram S.", billing: "Fixed", stage: 5, salesOwner: "Arjun", start: "2026-08-12", cost: "₹7,50,000", payments: "70% received · 30% on handover", server: "Askeva-hosted", callTime: "10:30 daily", redesigns: 2, deadline: "2026-09-25", uiStart: "2026-08-14", milestones: [{ id: "M1", name: MS[0], target: "2026-08-13", actual: "2026-08-13" }, { id: "M2", name: MS[1], target: "2026-08-17", actual: "2026-08-18" }, { id: "M3", name: MS[2], target: "2026-08-26", actual: "2026-08-30" }, { id: "M4", name: MS[3], target: "2026-09-01", actual: "2026-09-01" }, { id: "M5", name: MS[4], target: "2026-09-12", actual: "2026-09-14" }, { id: "M6", name: MS[5], target: "2026-09-15", actual: null }, { id: "M7", name: MS[6], target: "2026-09-25", actual: null }], gates: { 0: g(0, 5), 1: g(1, 10), 2: g(2, 4), 3: g(3, 3), 4: g(4, 5), 5: { brd: true, testDoc: true, arch: true, devDone: true }, 6: {} } },
      { id: "p4", code: "ASK-2026-046", client: "FinTrust Capital", spoc: "Neha Kapoor", clientManager: "—", clientOwner: "—", billing: "Fixed", stage: 0, salesOwner: "Meera", start: "2026-09-16", cost: "₹3,20,000", payments: "Advance pending", server: "TBD", callTime: "TBD", redesigns: 0, gates: { 0: { docs: true }, 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} } },
    ],
    tasks: [
      { id: "t1", projectId: "p1", title: "PC review of batch 2 screens before client share", assignee: "PC", due: "2026-09-16", stage: "UI", status: "doing", priority: "High" },
      { id: "t2", projectId: "p1", title: "Update UI documentation — screen status list", assignee: "PC", due: "2026-09-17", stage: "UI", status: "todo", priority: "Med" },
      { id: "t3", projectId: "p1", title: "Chase product images for catalogue page", assignee: "PC", due: "2026-09-13", stage: "UI", status: "todo", priority: "High" },
      { id: "t4", projectId: "p2", title: "Collect escalation matrix from client side", assignee: "PC", due: "2026-09-16", stage: "Onboarding", status: "todo", priority: "High" },
      { id: "t5", projectId: "p2", title: "Explain cost sheet + get email confirmation", assignee: "PC / PM", due: "2026-09-17", stage: "Onboarding", status: "todo", priority: "High" },
      { id: "t6", projectId: "p3", title: "Log regression bugs from round 2 in Trello", assignee: "Tester", due: "2026-09-15", stage: "Backend", status: "doing", priority: "High" },
      { id: "t7", projectId: "p3", title: "Senior Dev review of tested build", assignee: "Senior Dev", due: "2026-09-18", stage: "Backend", status: "todo", priority: "Med" },
      { id: "t8", projectId: "p3", title: "Design system approval email filed", assignee: "PC", due: "2026-08-20", stage: "UI", status: "done", priority: "Low" },
      { id: "t9", projectId: "p4", title: "Get payment confirmation from Sales", assignee: "Sales · Meera", due: "2026-09-16", stage: "Handover from Sales", status: "todo", priority: "High" },
    ],
    followups: [
      { id: "f1", projectId: "p1", type: "Client call", with: "Priya Menon", channel: "Call", due: "2026-09-16", note: "Share batch 2 preview link; confirm catalogue images ETA", status: "pending" },
      { id: "f2", projectId: "p1", type: "WhatsApp update", with: "Client group", channel: "WhatsApp", due: "2026-09-16", note: "Daily progress + MoM", status: "pending" },
      { id: "f3", projectId: "p1", type: "Reminder", with: "Priya Menon", channel: "WhatsApp", due: "2026-09-14", note: "3rd reminder — product images pending since Sep 10", status: "pending", log: [{ date: "2026-09-10", text: "Asked for catalogue images; client said by Friday." }, { date: "2026-09-12", text: "2nd reminder sent in group. No reply." }] },
      { id: "f4", projectId: "p2", type: "Email approval", with: "Dr. Anand", channel: "Email", due: "2026-09-17", note: "Cost + scope + timeline confirmation email", status: "pending" },
      { id: "f5", projectId: "p2", type: "Client call", with: "Dr. Anand", channel: "Call", due: "2026-09-16", note: "Onboarding follow-up: cloud elements, cadence", status: "pending" },
      { id: "f6", projectId: "p3", type: "Client call", with: "Vikram S.", channel: "Call", due: "2026-09-16", note: "Demo credentials walkthrough", status: "pending" },
      { id: "f7", projectId: "p3", type: "Internal call", with: "Dev team", channel: "Call", due: "2026-09-16", note: "Blockers on payment gateway sandbox", status: "done" },
      { id: "f8", projectId: "p3", type: "Email approval", with: "Vikram S.", channel: "Email", due: "2026-09-19", note: "Client approval of tested build", status: "pending" },
      { id: "f9", projectId: "p4", type: "Internal call", with: "Meera (Sales)", channel: "Call", due: "2026-09-16", note: "Handover pack: payment proof, cost sheet, verbal commitments", status: "pending" },
    ],
    crs: [
      { id: "CR-001", projectId: "p1", title: "Add wishlist feature to product pages", kind: "New requirement", raised: "2026-09-11", cost: "₹45,000", timeline: "+4 days", status: "Quoted", email: false },
      { id: "CR-002", projectId: "p1", title: "Header colour correction per approved design system", kind: "Correction", raised: "2026-09-12", cost: "₹0", timeline: "+0 days", status: "Approved", email: true },
      { id: "CR-003", projectId: "p3", title: "Parent login portal with fee history", kind: "New requirement", raised: "2026-09-10", cost: "₹1,10,000", timeline: "+9 days", status: "Estimated", email: false },
      { id: "CR-004", projectId: "p3", title: "Export attendance report to Excel", kind: "New requirement", raised: "2026-09-15", cost: "—", timeline: "—", status: "Raised", email: false },
    ],
    clientCommunications: [
      { id: "comm1", projectId: "p1", date: "2026-09-16", time: "11:30", channel: "WhatsApp", recipient: "Priya Menon", type: "Daily Call MoM", message: "Shared batch 2 screens overview and agreed on catalogue images delivery by Friday.", court: "client" },
      { id: "comm2", projectId: "p1", date: "2026-09-15", time: "16:45", channel: "Email", recipient: "R. Iyer", type: "CR Confirmation", message: "Sent CR-002 confirmation email for header color correction token match.", court: "us" },
      { id: "comm3", projectId: "p3", date: "2026-09-16", time: "10:45", channel: "Call", recipient: "Vikram S.", type: "Client Call", message: "Conducted demo credentials walkthrough and noted fee portal feedback.", court: "client" },
    ],
  };
}

export const SEED_TEAM = {
  p1: { team: { ui: "Rahul", backend: "Farhan", tester: "Divya", seniorDev: "Karthik" }, budget: { uiDays: 10, backendDays: 22, testDays: 6, pcDays: 10, dayRate: 4000 } },
  p2: { team: { ui: "Sneha", backend: "Farhan", tester: "Divya", seniorDev: "Karthik" }, budget: { uiDays: 8, backendDays: 30, testDays: 6, pcDays: 12, dayRate: 4000 } },
  p3: { team: { ui: "Rahul", backend: "Imran", tester: "Divya", seniorDev: "Karthik" }, budget: { uiDays: 12, backendDays: 35, testDays: 8, pcDays: 14, dayRate: 4000 } },
  p4: { team: { ui: "TBD", backend: "TBD", tester: "TBD", seniorDev: "Karthik" }, budget: { uiDays: 8, backendDays: 18, testDays: 4, pcDays: 8, dayRate: 4000 } },
};

export const SEED_FINANCE = {
  p1: { invoices: [{ id: "i1", date: "2026-09-02", label: "Advance 40%", amount: 192000, status: "Received" }, { id: "i2", date: "2026-09-17", label: "30% on UI approval", amount: 144000, status: "Due" }, { id: "i3", date: "2026-10-20", label: "30% on handover", amount: 144000, status: "Due" }], expenses: [{ id: "e1", date: "2026-09-03", category: "Server / hosting", desc: "Staging server — 2 months", amount: 6000 }, { id: "e2", date: "2026-09-04", category: "Domain / SSL", desc: "SSL certificate", amount: 1500 }, { id: "e3", date: "2026-09-10", category: "Third-party API", desc: "SMS gateway credits", amount: 4000 }], effort: { ui: 8, backend: 0, tester: 0, pc: 6 } },
  p2: { invoices: [{ id: "i4", date: "2026-09-14", label: "September resources", amount: 120000, status: "Received" }, { id: "i5", date: "2026-10-01", label: "October resources", amount: 120000, status: "Due" }], expenses: [], effort: { ui: 1, backend: 2, tester: 0, pc: 2 } },
  p3: { invoices: [{ id: "i6", date: "2026-08-12", label: "Advance 40%", amount: 300000, status: "Received" }, { id: "i7", date: "2026-08-30", label: "30% on UI approval", amount: 225000, status: "Received" }, { id: "i8", date: "2026-09-25", label: "30% on handover", amount: 225000, status: "Due" }], expenses: [{ id: "e4", date: "2026-08-14", category: "Server / hosting", desc: "Production + staging — 3 months", amount: 18000 }, { id: "e5", date: "2026-08-20", category: "Third-party API", desc: "Payment gateway setup", amount: 12000 }, { id: "e6", date: "2026-09-08", category: "Travel / onsite", desc: "Client onsite visit", amount: 5500 }, { id: "e7", date: "2026-09-12", category: "Third-party API", desc: "Extra WhatsApp API conversations", amount: 9000 }], effort: { ui: 14, backend: 33, tester: 7, pc: 16 } },
  p4: { invoices: [{ id: "i9", date: "2026-09-16", label: "Advance 40%", amount: 128000, status: "Due" }], expenses: [], effort: { ui: 0, backend: 0, tester: 0, pc: 1 } },
};

export const SEED_STAFF = [
  { id: "s1", name: "Rahul", role: "UI / Frontend", dept: "Design", salary: 60000, allowances: 5000, joined: "2025-03-01", status: "Active", workDays: 22 },
  { id: "s2", name: "Sneha", role: "UI / Frontend", dept: "Design", salary: 48000, allowances: 3000, joined: "2026-01-15", status: "Active", workDays: 22 },
  { id: "s3", name: "Farhan", role: "Backend", dept: "Engineering", salary: 85000, allowances: 6000, joined: "2024-08-01", status: "Active", workDays: 22 },
  { id: "s4", name: "Imran", role: "Backend", dept: "Engineering", salary: 78000, allowances: 6000, joined: "2025-06-10", status: "Active", workDays: 22 },
  { id: "s5", name: "Divya", role: "Manual tester", dept: "QA", salary: 42000, allowances: 3000, joined: "2025-09-01", status: "Active", workDays: 22 },
  { id: "s6", name: "Karthik", role: "Senior Dev / Architect", dept: "Engineering", salary: 140000, allowances: 10000, joined: "2023-02-01", status: "Active", workDays: 22 },
  { id: "s7", name: "PC", role: "Project Coordinator", dept: "Delivery", salary: 55000, allowances: 4000, joined: "2025-01-06", status: "Active", workDays: 22 },
];

export const SEED_PAYROLL = [
  { id: "pr1", staffId: "s1", month: "2026-08", gross: 65000, bonus: 0, deductions: 7200, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr2", staffId: "s2", month: "2026-08", gross: 51000, bonus: 0, deductions: 5400, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr3", staffId: "s3", month: "2026-08", gross: 91000, bonus: 5000, deductions: 10800, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr4", staffId: "s4", month: "2026-08", gross: 84000, bonus: 0, deductions: 9600, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr5", staffId: "s5", month: "2026-08", gross: 45000, bonus: 0, deductions: 4800, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr6", staffId: "s6", month: "2026-08", gross: 150000, bonus: 0, deductions: 18000, status: "Paid", paidOn: "2026-09-01" },
  { id: "pr7", staffId: "s7", month: "2026-08", gross: 59000, bonus: 0, deductions: 6000, status: "Paid", paidOn: "2026-09-01" },
];

export const SEED_RELEASES = [
  { id: "REL-001", projectId: "p3", env: "staging", version: "v0.6.2", tag: "build-218", tasks: ["t16"], notes: "Fee reminder cron (WhatsApp template) — idempotent job run", url: "https://staging.edunest.askeva.in", requestedBy: "Farhan", requestedOn: "2026-09-14", status: "deployed", deployedBy: "Naveen", deployedOn: "2026-09-14", smoke: "Passed", downtime: "none", history: [{ date: "2026-09-14", actor: "Farhan", role: "Backend", to: "requested", note: "Fix for BUG-005 ready for retest" }, { date: "2026-09-14", actor: "Naveen", role: "DevOps", to: "deployed", note: "Smoke: cron fires once · logs clean" }] },
  { id: "REL-002", projectId: "p3", env: "staging", version: "v0.6.3", tag: "build-224", tasks: ["t14", "t15"], notes: "Attendance report API + Excel export · RBAC role-hierarchy fix", url: "https://staging.edunest.askeva.in", requestedBy: "Imran", requestedOn: "2026-09-16", status: "requested", deployedBy: null, deployedOn: null, smoke: "", downtime: "", history: [{ date: "2026-09-16", actor: "Imran", role: "Backend", to: "requested", note: "Both tasks dev-done, need staging for Divya" }] },
  { id: "REL-003", projectId: "p1", env: "staging", version: "v0.3.0", tag: "build-141", tasks: ["t11"], notes: "Header colour correction (CR-002)", url: "https://staging.novaretail.askeva.in", requestedBy: "Rahul", requestedOn: "2026-09-15", status: "deployed", deployedBy: "Naveen", deployedOn: "2026-09-15", smoke: "Passed", downtime: "none", history: [{ date: "2026-09-15", actor: "Rahul", role: "Frontend", to: "requested", note: "" }, { date: "2026-09-15", actor: "Naveen", role: "DevOps", to: "deployed", note: "Smoke: header renders on 3 breakpoints" }] },
  { id: "REL-004", projectId: "p3", env: "production", version: "v0.5.0", tag: "build-190", tasks: [], notes: "Student onboarding + fee module · first production cut", url: "https://app.edunest.in", requestedBy: "PC", requestedOn: "2026-09-08", status: "rolled_back", deployedBy: "Naveen", deployedOn: "2026-09-09", smoke: "Failed", downtime: "22:00–22:40", approvals: { seniorDev: "2026-09-08", pm: "2026-09-08", client: "2026-09-08" }, history: [{ date: "2026-09-08", actor: "PC", role: "PC", to: "requested", note: "Client demo accepted 06 Sep" }, { date: "2026-09-08", actor: "Karthik", role: "Senior Dev", to: "approved", note: "Architecture review OK" }, { date: "2026-09-08", actor: "Anita", role: "PM", to: "go", note: "GO for production · window 22:00" }, { date: "2026-09-09", actor: "Naveen", role: "DevOps", to: "deployed", note: "Deployed 22:04" }, { date: "2026-09-09", actor: "Naveen", role: "DevOps", to: "rolled_back", note: "ROLLBACK — Payment callback 500 on live gateway · BUG-002 raised · reverted to v0.4.7 at 22:38" }] },
];
