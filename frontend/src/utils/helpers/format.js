export const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Extract the integer rupee amount from strings like "₹4,80,000" or "₹1,20,000 / month". */
export const parseAmount = (v) => parseInt(String(v).replace(/[^\d]/g, ""), 10) || 0;

export const uid = () => Math.random().toString(36).slice(2, 8);

export const pad3 = (n) => String(n).padStart(3, "0");

export const avg = (a) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : 0);
