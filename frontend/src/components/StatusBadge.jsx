const STYLES = {
  ACTIVE: { cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  COMPLETED: { cls: "bg-sky-50 text-sky-700 ring-sky-600/20", dot: "bg-sky-500" },
  CLOSED: { cls: "bg-rose-50 text-rose-700 ring-rose-600/20", dot: "bg-rose-500" },
};

/** 🟢 ACTIVE  🔵 COMPLETED  🔴 CLOSED */
export default function StatusBadge({ status, className = "" }) {
  const s = STYLES[status] ?? STYLES.CLOSED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.cls} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}
