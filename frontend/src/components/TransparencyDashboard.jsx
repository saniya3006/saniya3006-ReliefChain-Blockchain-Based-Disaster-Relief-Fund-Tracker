import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Coins, HandCoins, Hash, PiggyBank, Users } from "lucide-react";
import AllocationChart from "./AllocationChart";
import ProgressBar from "./ProgressBar";
import StatsCard from "./StatsCard";
import StatusBadge from "./StatusBadge";
import TxHash from "./TxHash";
import { formatINR, formatNumber, timeAgo } from "../utils/format";

/** Platform-wide transparency view, built entirely from /api/stats (smart contract data + events). */
export default function TransparencyDashboard({ stats }) {
  const utilization = stats.totalRaised ? (stats.totalAllocated / stats.totalRaised) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard icon={Coins} label="Total Raised" value={formatINR(stats.totalRaised)} tone="teal" />
        <StatsCard icon={HandCoins} label="Total Allocated" value={formatINR(stats.totalAllocated)} tone="blue" />
        <StatsCard icon={PiggyBank} label="Remaining Funds" value={formatINR(stats.remainingFunds)} tone="orange" />
        <StatsCard icon={Users} label="Donors" value={formatNumber(stats.totalDonors)} sub="unique per campaign" tone="violet" />
        <StatsCard
          icon={Hash}
          label="Transactions"
          value={formatNumber(stats.totalTransactions)}
          sub={`${stats.totalDonations} donations · ${stats.totalTransactions - stats.totalDonations} allocations`}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card min-w-0 p-5 sm:p-6 lg:col-span-3">
          <h3 className="font-bold text-slate-900">Fund Utilization (all campaigns)</h3>
          <p className="mt-1 text-sm text-slate-500">
            {utilization.toFixed(1)}% of all donated money has a recorded allocation on the blockchain.
          </p>
          <div className="mt-3">
            <ProgressBar value={utilization} />
          </div>
          <div className="mt-6">
            <AllocationChart data={stats.allocationByCategory} height={220} />
          </div>
        </div>

        <div className="card min-w-0 p-5 sm:p-6 lg:col-span-2">
          <h3 className="font-bold text-slate-900">Per-campaign breakdown</h3>
          <ul className="mt-4 space-y-4">
            {stats.campaigns.map((c) => {
              const pct = c.raisedAmount ? (c.allocatedAmount / c.raisedAmount) * 100 : 0;
              return (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-2">
                    <Link to={`/campaigns/${c.id}`} className="truncate text-sm font-semibold text-slate-800 hover:text-teal-700">
                      {c.name}
                    </Link>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Raised {formatINR(c.raisedAmount)} · Allocated {formatINR(c.allocatedAmount)} · Remaining{" "}
                    {formatINR(c.availableAmount)}
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar value={pct} size="sm" />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-900">Public ledger: latest blockchain transactions</h3>
          <p className="text-sm text-slate-500">Read directly from the smart contract's event log.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Type</th>
                <th className="px-5 py-2.5 font-semibold">Campaign</th>
                <th className="px-5 py-2.5 font-semibold">Details</th>
                <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                <th className="px-5 py-2.5 font-semibold">Block</th>
                <th className="px-5 py-2.5 font-semibold">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recentTransactions.map((t) => (
                <tr key={t.txHash} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-5 py-3">
                    {t.type === "Donation" ? (
                      <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                        <ArrowDownRight className="h-4 w-4" /> Donation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-medium text-sky-700">
                        <ArrowUpRight className="h-4 w-4" /> Allocation
                      </span>
                    )}
                  </td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-slate-700">{t.campaignName}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    {t.type === "Donation" ? `from ${t.label}` : `for ${t.label}`} · {timeAgo(t.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">{formatINR(t.amount)}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">#{t.blockNumber}</td>
                  <td className="px-5 py-3">
                    <TxHash hash={t.txHash} />
                  </td>
                </tr>
              ))}
              {stats.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
