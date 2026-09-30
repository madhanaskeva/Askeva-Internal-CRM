// Date/time helpers — same semantics as the original script (ISO yyyy-mm-dd strings, local time).

export const getTodayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Frozen at load, exactly like the original `TODAY` constant. */
export const TODAY = getTodayIso();

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) => Math.round((new Date(a) - new Date(b)) / 86400000);

export const nowTime = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
};

export const fmtTime = (t) => {
  if (!t) return "";
  const [H, M] = t.split(":").map(Number);
  const ap = H >= 12 ? "PM" : "AM";
  return `${String(H % 12 || 12).padStart(2, "0")}:${String(M).padStart(2, "0")} ${ap}`;
};

export const minsBetween = (d1, t1, d2, t2) => {
  const a = new Date(d1 + "T" + (t1 || "09:00") + ":00");
  const b = new Date(d2 + "T" + (t2 || "09:00") + ":00");
  return Math.round((a - b) / 60000);
};

export const fmtDur = (m) => {
  if (m == null || isNaN(m)) return "—";
  if (m < 60) return m + "m";
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return hh >= 48 ? Math.round(hh / 24) + "d " + (hh % 24) + "h" : hh + "h " + String(mm).padStart(2, "0") + "m";
};

/** "16 Sept" style short date. */
export const fmt = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const monthKey = (d) => String(d || "").slice(0, 7);

export const monthLabel = (m) => {
  const [y, mo] = m.split("-");
  return new Date(+y, +mo - 1, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

export const monthLabelShort = (k) => {
  const [y, m] = k.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
};

export const shiftMonth = (m, n) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(y, mo - 1 + n, 1);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
};
