// Demo follow-ups.

export const followups = [
  { id: "f1", projectId: "p1", type: "Client call", with: "Priya Menon", channel: "Call", due: "2026-09-16", note: "Share batch 2 preview link; confirm catalogue images ETA", status: "pending" },
  { id: "f2", projectId: "p1", type: "WhatsApp update", with: "Client group", channel: "WhatsApp", due: "2026-09-16", note: "Daily progress + MoM", status: "pending" },
  { id: "f3", projectId: "p1", type: "Reminder", with: "Priya Menon", channel: "WhatsApp", due: "2026-09-14", note: "3rd reminder — product images pending since Sep 10", status: "pending", log: [{ date: "2026-09-10", text: "Asked for catalogue images; client said by Friday." }, { date: "2026-09-12", text: "2nd reminder sent in group. No reply." }] },
  { id: "f4", projectId: "p2", type: "Email approval", with: "Dr. Anand", channel: "Email", due: "2026-09-17", note: "Cost + scope + timeline confirmation email", status: "pending" },
  { id: "f5", projectId: "p2", type: "Client call", with: "Dr. Anand", channel: "Call", due: "2026-09-16", note: "Onboarding follow-up: cloud elements, cadence", status: "pending" },
  { id: "f6", projectId: "p3", type: "Client call", with: "Vikram S.", channel: "Call", due: "2026-09-16", note: "Demo credentials walkthrough", status: "pending" },
  { id: "f7", projectId: "p3", type: "Internal call", with: "Dev team", channel: "Call", due: "2026-09-16", note: "Blockers on payment gateway sandbox", status: "done" },
  { id: "f8", projectId: "p3", type: "Email approval", with: "Vikram S.", channel: "Email", due: "2026-09-19", note: "Client approval of tested build", status: "pending" },
  { id: "f9", projectId: "p4", type: "Internal call", with: "Meera (Sales)", channel: "Call", due: "2026-09-16", note: "Handover pack: payment proof, cost sheet, verbal commitments", status: "pending" },
];
