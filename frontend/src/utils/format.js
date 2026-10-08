const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("en-IN");

/** 1000000 -> "₹10,00,000" */
export const formatINR = (n) => inr.format(Number(n) || 0);

/** 1000000 -> "₹10L", 25000 -> "₹25K" (compact, for chart labels) */
export function formatINRShort(n) {
  n = Number(n) || 0;
  if (n >= 1e7) return `₹${+(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${+(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${+(n / 1e3).toFixed(1)}K`;
  return `₹${n}`;
}

export const formatNumber = (n) => num.format(Number(n) || 0);

/** "0x83a7...91fd" */
export function shortHash(h, start = 6, end = 4) {
  if (!h) return "";
  return h.length <= start + end + 3 ? h : `${h.slice(0, start)}…${h.slice(-end)}`;
}

/** unix seconds -> "08 Oct 2026" */
export const formatDate = (ts) =>
  new Date(Number(ts) * 1000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** unix seconds -> "08 Oct 2026, 10:42 pm" */
export const formatDateTime = (ts) =>
  new Date(Number(ts) * 1000).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function timeAgo(ts) {
  const s = Math.floor(Date.now() / 1000 - Number(ts));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

export function daysLeft(deadline) {
  return Math.ceil((Number(deadline) * 1000 - Date.now()) / 86400000);
}
