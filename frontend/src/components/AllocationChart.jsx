import { Cell, Pie, PieChart, Tooltip } from "recharts";
import { categoryInfo } from "../utils/constants";
import { formatINR, formatINRShort } from "../utils/format";

function ChartTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="flex items-center gap-1.5 font-semibold text-slate-900">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
        {d.label}
      </p>
      <p className="mt-0.5 text-slate-600">
        {formatINR(d.amount)} · {total ? ((d.amount / total) * 100).toFixed(1) : 0}%
      </p>
    </div>
  );
}

/**
 * Donut chart of fund allocation by category, with a labelled legend so
 * identity never depends on color alone.
 * data: [{ category, amount }]
 */
export default function AllocationChart({ data = [], centerLabel = "Allocated", height = 240 }) {
  const rows = data
    .filter((d) => d.amount > 0)
    .map((d) => ({ ...d, ...categoryInfo(d.category) }));
  const total = rows.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <PieChart width={height} height={height}>
            <Pie
              data={rows.length ? rows : [{ amount: 1, color: "#e2e8f0", label: "None" }]}
              dataKey="amount"
              nameKey="label"
              innerRadius="64%"
              outerRadius="96%"
              paddingAngle={rows.length > 1 ? 1.5 : 0}
              cornerRadius={4}
              stroke="#fff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {(rows.length ? rows : [{ color: "#e2e8f0" }]).map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            {rows.length > 0 && <Tooltip content={<ChartTooltip total={total} />} />}
        </PieChart>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl font-bold text-slate-900">{formatINRShort(total)}</p>
            <p className="text-xs text-slate-500">{centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {rows.length === 0 && <li className="text-sm text-slate-500">No funds allocated yet.</li>}
        {rows.map((d) => {
          const Icon = d.icon;
          const pct = total ? (d.amount / total) * 100 : 0;
          return (
            <li key={d.category} className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: d.color }} />
              <Icon className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="flex-1 text-sm font-medium text-slate-700">{d.label}</span>
              <span className="text-sm font-semibold text-slate-900">{formatINR(d.amount)}</span>
              <span className="w-12 text-right text-xs text-slate-500">{pct.toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
