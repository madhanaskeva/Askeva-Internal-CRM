// Form-modal submission — port of the original `submit()` / `saveStaff()`.
import { STAGES } from "../../data";
import { defaultMilestones } from "../storage/seed";
import { TODAY, addDays, daysBetween } from "../helpers/date";
import { parseAmount, uid } from "../helpers/format";
import { DEV_TRACK, trackOf } from "../domain/tasks";
import { addChangeRequest, getChangeRequestById } from "../entities/changeRequestUtils";
import { addCommunication } from "../entities/communicationUtils";
import { addFollowup } from "../entities/followupUtils";
import { adjustPayslip } from "../entities/payrollUtils";
import { addExpense, addInvoice, addProject, getProjectById, logEffort, logOverrun, requestRevision } from "../entities/projectUtils";
import { isStrict } from "../entities/ruleUtils";
import { saveStaff } from "../entities/staffUtils";
import { addTask, editTaskRecord } from "../entities/taskUtils";
import { raiseBug } from "../entities/bugUtils";
import { done } from "./context";

const blank = (v) => !String(v ?? "").trim();
/** First failing [key, message] pair, or null. */
const requireAll = (form, rules) => {
  const miss = rules.find(([k]) => blank(form[k]));
  return miss ? miss[1] : null;
};

function buildProject(form) {
  const paid = form.paymentConfirmed === "Yes";
  const dl = form.deadline || addDays(form.start, 45);
  const span = Math.max(7, daysBetween(dl, form.start));
  const off = [1, 3, Math.min(13, Math.round(span * 0.25)), Math.round(span * 0.32), Math.round(span * 0.72), Math.round(span * 0.88), span];
  const price = parseAmount(form.cost);
  const adv = Math.round((price * (+form.advance || 0)) / 100);
  return {
    id: "p" + uid(), code: form.code, client: form.client, projectType: form.projectType, spoc: form.spoc, spocPhone: form.spocPhone, spocEmail: form.spocEmail,
    clientManager: form.clientManager || "—", clientOwner: form.clientOwner || "—", billing: form.billing, stage: 0, salesOwner: form.salesOwner || "—",
    start: form.start, deadline: dl, uiStart: null, milestones: defaultMilestones(form.start, off).map((m) => ({ ...m, comments: [] })), cost: form.cost,
    payments: (paid ? `Advance ${form.advance}% received · ` : `Advance ${form.advance}% pending · `) + form.terms,
    server: form.server, domain: form.domain, cloud: form.cloud, callTime: form.callTime + " daily", redesigns: 0,
    team: { ui: form.uiLead || "TBD", backend: form.backendLead || "TBD", tester: form.tester || "TBD", seniorDev: form.seniorDev || "TBD" },
    budget: { uiDays: +form.uiDays || 0, backendDays: +form.backendDays || 0, testDays: +form.testDays || 0, pcDays: +form.pcDays || 0, dayRate: +form.dayRate || 0 },
    invoices: price
      ? [
          { id: "i" + uid(), date: form.start, label: `Advance ${form.advance}%`, amount: adv, status: paid ? "Received" : "Due" },
          { id: "i" + uid(), date: dl, label: "Balance on handover", amount: price - adv, status: "Due" },
        ]
      : [],
    expenses: [], effort: { ui: 0, backend: 0, tester: 0, pc: 0 },
    gates: {
      0: { payment: paid, billing: true, docs: false, contacts: !!form.clientManager, refs: false },
      1: { spoc: true, server: form.server !== "TBD", domain: !!form.domain, cost: false, billingRec: true, cadence: !!form.callTime },
      2: {}, 3: {}, 4: {}, 5: {}, 6: {},
    },
    baselineDeadline: dl, revisions: [], overrides: [], overrun: null, effortLog: [],
  };
}

/** Handlers per modal kind: (form, extra, ctx) → error string | { message } | undefined */
const handlers = {
  project(form, _extra, ctx) {
    const err = requireAll(form, [["client", "Client name is required"], ["spoc", "Client SPOC is required"], ["cost", "Project cost is required"]]);
    if (err) return err;
    addProject(ctx, { project: buildProject(form) });
  },

  task(form, extra, ctx) {
    if (blank(form.title)) return "Task title is required";
    if (extra?.taskId) {
      editTaskRecord(ctx, {
        taskId: extra.taskId,
        updates: {
          projectId: form.projectId,
          title: form.title,
          assignee: form.assignee,
          due: form.due,
          priority: form.priority,
          ...(form.opsKind ? { opsKind: form.opsKind } : {}),
        },
      });
      return { message: "Task updated successfully." };
    }
    const role = ctx.role;
    const project = getProjectById(form.projectId) || { stage: 0 };
    const track = trackOf({ assignee: form.assignee });
    const needsInbox = ["frontend", "backend", "devops", "qa"].includes(track) && role !== "DevOps" && form.assignee !== "Unassigned";
    const task = {
      id: "t" + uid(), projectId: form.projectId, title: form.title, assignee: form.assignee, track, owner: "PC",
      createdBy: ctx.actor, due: form.due, stage: form.stage || STAGES[project.stage], status: "todo", priority: form.priority, blocked: false,
      ...(form.opsKind ? { opsKind: form.opsKind } : {}),
      ...(role === "DevOps" ? { selfCreated: true } : {}),
      ...(needsInbox ? { acceptance: "pending", assignedOn: TODAY, assignedBy: ctx.actor } : {}),
      history: [{ date: TODAY, actor: ctx.actor, role, from: null, to: "todo", note: "Task created · assigned to " + form.assignee }],
    };
    addTask(ctx, { task });
    if (needsInbox) return { message: form.assignee + " has been notified — task waits in their Inbox for acceptance (same-day rule)." };
  },

  bug(form, extra, ctx) {
    const err = requireAll(form, [["desc", "Describe the bug"], ["evidence", "Evidence is required (screenshot / log reference)"]]);
    if (err) return err;
    raiseBug(ctx, { taskId: extra.taskId, projectId: extra.projectId, form });
  },

  followup(form, _extra, ctx) {
    if (blank(form.with)) return "Who is this follow-up with?";
    addFollowup(ctx, { followup: { id: "f" + uid(), projectId: form.projectId, type: form.type, with: form.with, channel: form.channel, due: form.due, note: form.note, status: "pending", court: form.court } });
  },

  communication(form, _extra, ctx) {
    const err = requireAll(form, [["recipient", "Recipient / SPOC is required"], ["message", "Message detail is required"]]);
    if (err) return err;
    addCommunication(ctx, { communication: { id: "comm" + uid(), projectId: form.projectId, date: ctx.date, time: ctx.time, channel: form.channel, recipient: form.recipient, type: form.type, message: form.message, court: form.court } });
  },

  expense(form, _extra, ctx) {
    const err = requireAll(form, [["desc", "Describe the expense"], ["amount", "Amount is required"]]);
    if (err) return err;
    addExpense(ctx, { projectId: form.projectId, expense: { id: "e" + uid(), date: form.date, category: form.category, desc: form.desc, amount: parseAmount(form.amount) } });
  },

  invoice(form, _extra, ctx) {
    const err = requireAll(form, [["label", "Label is required"], ["amount", "Amount is required"]]);
    if (err) return err;
    addInvoice(ctx, { projectId: form.projectId, invoice: { id: "i" + uid(), date: form.date, label: form.label, amount: parseAmount(form.amount), status: form.status } });
  },

  effort(form, _extra, ctx) {
    const cr = form.crId ? getChangeRequestById(form.crId) : null;
    if (cr && cr.status !== "Approved" && isStrict()) {
      return `${cr.id} is ${cr.status}, not Approved. No email confirmation = no work. Get the CR approved first.`;
    }
    logEffort(ctx, { projectId: form.projectId, entry: { id: "el" + uid(), role: form.role, days: +form.days || 0, crId: form.crId || null, unapproved: !!(cr && cr.status !== "Approved") } });
  },

  revise(form, _extra, ctx) {
    const err = requireAll(form, [["to", "New deadline is required"], ["reason", "A reason is mandatory"]]);
    if (err) return err;
    requestRevision(ctx, { projectId: form.projectId, revisionId: "rv" + uid(), form });
  },

  overrun(form, _extra, ctx) {
    if (blank(form.note)) return "Explain the overrun";
    logOverrun(ctx, { projectId: form.projectId, form });
  },

  staff(form, _extra, ctx) {
    const err = requireAll(form, [["name", "Name is required"], ["salary", "Monthly salary is required"]]);
    if (err) return err;
    saveStaff(ctx, { newId: "s" + uid(), record: { name: form.name, role: form.role, dept: form.dept, salary: +form.salary || 0, allowances: +form.allowances || 0, workDays: +form.workDays || 22, joined: form.joined } });
  },

  staffFull(form, extra, ctx) {
    const err = requireAll(form, [["name", "Name is required"], ["role", "Role is required"]]);
    if (err) return err;
    if (form.role === "Admin" && ctx.role !== "SuperAdmin") return "Only the Super admin can create or edit Admins.";
    const record = {
      name: form.name, role: form.role, dept: form.dept, email: form.email, phone: form.phone, emergency: form.emergency, address: form.address, idNo: form.idNo,
      pan: form.pan, bank: form.bank, salary: +form.salary || 0, allowances: +form.allowances || 0, workDays: +form.workDays || 22, joined: form.joined,
      reportsTo: form.reportsTo || null, notes: form.notes,
    };
    saveStaff(ctx, { staffId: extra.staff?.id, newId: "s" + uid(), record });
  },

  payAdjust(form, extra, ctx) {
    adjustPayslip(ctx, { entryId: extra.entry?.id, bonus: +form.bonus || 0, deductions: +form.deductions || 0, note: form.note });
  },

  cr(form, _extra, ctx) {
    if (blank(form.title)) return "Describe the request";
    addChangeRequest(ctx, { form });
  },
};

/**
 * Validate and save a form-modal submission.
 * Returns { ok: false, error } to show inside the modal, or { ok: true, closeModal, message? }.
 */
export function submitModal(ctx, kind, form, extra = {}) {
  const result = handlers[kind](form, extra, ctx);
  if (typeof result === "string") return { ok: false, error: result };
  return done({ closeModal: true, ...(result || {}) });
}
