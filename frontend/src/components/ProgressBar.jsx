export default function ProgressBar({ value = 0, size = "md" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const h = size === "lg" ? "h-3.5" : size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-slate-100 ${h}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
