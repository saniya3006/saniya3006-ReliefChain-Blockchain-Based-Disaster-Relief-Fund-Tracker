const TONES = {
  teal: "bg-teal-50 text-teal-700",
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-700",
};

export default function StatsCard({ icon: Icon, label, value, sub, tone = "teal" }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      {Icon && (
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}
