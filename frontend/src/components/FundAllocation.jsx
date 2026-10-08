import { PieChart as PieIcon, ReceiptText } from "lucide-react";
import { CATEGORIES, categoryInfo } from "../utils/constants";
import { formatDate, formatINR } from "../utils/format";
import AllocationChart from "./AllocationChart";
import { EmptyState } from "./States";
import TxHash from "./TxHash";

/** Shows how a campaign's collected funds were allocated (main transparency feature). */
export default function FundAllocation({ campaign, allocations = [] }) {
  const byCategory = CATEGORIES.map((c) => ({
    category: c.key,
    amount: allocations.filter((a) => a.category === c.key).reduce((s, a) => s + a.amount, 0),
  }));
  const allocatedPct = campaign.raisedAmount ? (campaign.allocatedAmount / campaign.raisedAmount) * 100 : 0;

  return (
    <div className="card p-5 sm:p-6">
      <h3 className="flex items-center gap-2 font-bold text-slate-900">
        <PieIcon className="h-5 w-5 text-teal-700" /> Fund Allocation
      </h3>

      {/* Raised -> Allocated -> Available summary */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center">
        <div>
          <p className="text-xs font-medium text-slate-500">Total raised</p>
          <p className="mt-0.5 font-bold text-slate-900">{formatINR(campaign.raisedAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Allocated</p>
          <p className="mt-0.5 font-bold text-teal-700">{formatINR(campaign.allocatedAmount)}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Not yet allocated</p>
          <p className="mt-0.5 font-bold text-orange-600">{formatINR(campaign.availableAmount)}</p>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        {allocatedPct.toFixed(1)}% of donated funds have a recorded use
      </p>

      {allocations.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={ReceiptText}
            title="No allocations recorded yet"
            text="When the relief organization uses funds, each allocation will appear here with its own transaction hash."
          />
        </div>
      ) : (
        <>
          <div className="mt-6">
            <AllocationChart data={byCategory} />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CATEGORIES.map((c) => {
              const amt = byCategory.find((b) => b.category === c.key).amount;
              const Icon = c.icon;
              return (
                <div key={c.key} className={`rounded-xl p-3 ${amt ? c.bg : "bg-slate-50"}`}>
                  <Icon className={`h-5 w-5 ${amt ? c.text : "text-slate-400"}`} />
                  <p className="mt-2 text-xs font-medium text-slate-600">{c.label}</p>
                  <p className="text-sm font-bold text-slate-900">{formatINR(amt)}</p>
                </div>
              );
            })}
          </div>

          <h4 className="mt-6 text-sm font-semibold text-slate-900">Allocation records</h4>
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {allocations.map((a) => {
              const info = categoryInfo(a.category);
              const Icon = info.icon;
              return (
                <li key={a.index} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${info.bg}`}>
                    <Icon className={`h-4 w-4 ${info.text}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {info.label} · {formatINR(a.amount)}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {a.note || "No note"} · {formatDate(a.timestamp)}
                    </p>
                  </div>
                  <TxHash hash={a.txHash} />
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
