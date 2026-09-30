// Form-modal submission — port of the original `submit()` / `saveStaff()`.
// Returns an error message (shown inside the modal) or null on success.
import { STAGES } from "../../constants/crm";
import { defaultMilestones } from "../../data/seed";
import { TODAY, addDays, daysBetween } from "../date";
import { parseAmount, uid } from "../format";
import { DEV_TRACK, trackOf } from "../domain/tasks";
import { selectStrict } from "../../redux/selectors";
import { crmActions } from "../../redux/slices/crmSlice";
import { modalClosed } from "../../redux/slices/uiSlice";
import { dispatch, getState, makeCtx, toast } from "./context";

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

/** Handlers per modal kind: (form, extra, api) → error string | undefined */
const handlers = {
  project(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["client", "Client name is required"], ["spoc", "Client SPOC is required"], ["cost", "Project cost is required"]]);
    if (err) return err;
    dispatch(crmActions.projectAdded({ ctx, project: buildProject(form) }));
  },

  task(form, _extra, { dispatch, ctx, state }) {
    if (blank(form.title)) return "Task title is required";
    const role = state.session.role;
    const project = state.crm.projects.find((p) => p.id === form.projectId) || { stage: 0 };
    const needsInbox = DEV_TRACK({ assignee: form.assignee }) && role !== "DevOps";
    const task = {
      id: "t" + uid(), projectId: form.projectId, title: form.title, assignee: form.assignee, track: trackOf({ assignee: form.assignee }), owner: "PC",
      createdBy: ctx.actor, due: form.due, stage: form.stage || STAGES[project.stage], status: "todo", priority: form.priority, blocked: false,
      ...(form.opsKind ? { opsKind: form.opsKind } : {}),
      ...(role === "DevOps" ? { selfCreated: true } : {}),
      ...(needsInbox ? { acceptance: "pending", assignedOn: TODAY, assignedBy: ctx.actor } : {}),
      history: [{ date: TODAY, actor: ctx.actor, role, from: null, to: "todo", note: "Task created · assigned to " + form.assignee }],
    };
    dispatch(crmActions.taskAdded({ ctx, task }));
    if (needsInbox) dispatch(toast(form.assignee + " has been notified — task waits in their Inbox for acceptance (same-day rule)."));
  },

  bug(form, extra, { dispatch, ctx }) {
    const err = requireAll(form, [["desc", "Describe the bug"], ["evidence", "Evidence is required (screenshot / log reference)"]]);
    if (err) return err;
    dispatch(crmActions.bugRaised({ ctx, taskId: extra.taskId, projectId: extra.projectId, form }));
  },

  followup(form, _extra, { dispatch, ctx }) {
    if (blank(form.with)) return "Who is this follow-up with?";
    dispatch(crmActions.followupAdded({ ctx, followup: { id: "f" + uid(), projectId: form.projectId, type: form.type, with: form.with, channel: form.channel, due: form.due, note: form.note, status: "pending", court: form.court } }));
  },

  communication(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["recipient", "Recipient / SPOC is required"], ["message", "Message detail is required"]]);
    if (err) return err;
    dispatch(crmActions.communicationAdded({ ctx, communication: { id: "comm" + uid(), projectId: form.projectId, date: ctx.date, time: ctx.time, channel: form.channel, recipient: form.recipient, type: form.type, message: form.message, court: form.court } }));
  },

  expense(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["desc", "Describe the expense"], ["amount", "Amount is required"]]);
    if (err) return err;
    dispatch(crmActions.expenseAdded({ ctx, projectId: form.projectId, expense: { id: "e" + uid(), date: form.date, category: form.category, desc: form.desc, amount: parseAmount(form.amount) } }));
  },

  invoice(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["label", "Label is required"], ["amount", "Amount is required"]]);
    if (err) return err;
    dispatch(crmActions.invoiceAdded({ ctx, projectId: form.projectId, invoice: { id: "i" + uid(), date: form.date, label: form.label, amount: parseAmount(form.amount), status: form.status } }));
  },

  effort(form, _extra, { dispatch, ctx, state }) {
    const cr = form.crId ? state.crm.crs.find((c) => c.id === form.crId) : null;
    if (cr && cr.status !== "Approved" && selectStrict(state)) {
      return `${cr.id} is ${cr.status}, not Approved. No email confirmation = no work. Get the CR approved first.`;
    }
    dispatch(crmActions.effortLogged({ ctx, projectId: form.projectId, entry: { id: "el" + uid(), role: form.role, days: +form.days || 0, crId: form.crId || null, unapproved: !!(cr && cr.status !== "Approved") } }));
  },

  revise(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["to", "New deadline is required"], ["reason", "A reason is mandatory"]]);
    if (err) return err;
    dispatch(crmActions.revisionRequested({ ctx, projectId: form.projectId, revisionId: "rv" + uid(), form }));
  },

  overrun(form, _extra, { dispatch, ctx }) {
    if (blank(form.note)) return "Explain the overrun";
    dispatch(crmActions.overrunLogged({ ctx, projectId: form.projectId, form }));
  },

  staff(form, _extra, { dispatch, ctx }) {
    const err = requireAll(form, [["name", "Name is required"], ["salary", "Monthly salary is required"]]);
    if (err) return err;
    dispatch(crmActions.staffSaved({ ctx, newId: "s" + uid(), record: { name: form.name, role: form.role, dept: form.dept, salary: +form.salary || 0, allowances: +form.allowances || 0, workDays: +form.workDays || 22, joined: form.joined } }));
  },

  staffFull(form, extra, { dispatch, ctx, state }) {
    const err = requireAll(form, [["name", "Name is required"], ["role", "Role is required"]]);
    if (err) return err;
    if (form.role === "Admin" && state.session.role !== "SuperAdmin") return "Only the Super admin can create or edit Admins.";
    const record = {
      name: form.name, role: form.role, dept: form.dept, email: form.email, phone: form.phone, emergency: form.emergency, address: form.address, idNo: form.idNo,
      pan: form.pan, bank: form.bank, salary: +form.salary || 0, allowances: +form.allowances || 0, workDays: +form.workDays || 22, joined: form.joined,
      reportsTo: form.reportsTo || null, notes: form.notes,
    };
    dispatch(crmActions.staffSaved({ ctx, staffId: extra.staff?.id, newId: "s" + uid(), record }));
  },

  payAdjust(form, extra, { dispatch, ctx }) {
    dispatch(crmActions.payslipAdjusted({ ctx, entryId: extra.entry?.id, bonus: +form.bonus || 0, deductions: +form.deductions || 0, note: form.note }));
  },

  cr(form, _extra, { dispatch, ctx }) {
    if (blank(form.title)) return "Describe the request";
    dispatch(crmActions.crAdded({ ctx, form }));
  },
};

export const submitModal = (kind, form, extra = {}) => {
  const state = getState();
  const error = handlers[kind](form, extra, { dispatch, state, ctx: makeCtx(state) });
  if (error) return error;
  dispatch(modalClosed());
  return null;
};
