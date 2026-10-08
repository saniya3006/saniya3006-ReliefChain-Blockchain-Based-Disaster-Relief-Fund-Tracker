import { Link } from "react-router-dom";
import { Activity, CheckCircle2, Coins, FolderHeart, HandCoins, Users } from "lucide-react";
import BlockchainStatus from "../components/BlockchainStatus";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import StatsCard from "../components/StatsCard";
import StatusBadge from "../components/StatusBadge";
import { ErrorState, Loader } from "../components/States";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";
import { formatINR, formatNumber } from "../utils/format";

export default function Dashboard() {
  const { data: s, error, loading, reload } = useApi(() => api.stats(), []);

  return (
    <>
      <PageHeader eyebrow="Overview" title="ReliefChain Dashboard" subtitle="Platform-wide numbers, computed from smart contract data." />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatsCard icon={FolderHeart} label="Total Campaigns" value={formatNumber(s.totalCampaigns)} sub={`${s.completedCampaigns} completed · ${s.closedCampaigns} closed`} tone="teal" />
              <StatsCard icon={Activity} label="Active Campaigns" value={formatNumber(s.activeCampaigns)} tone="orange" />
              <StatsCard icon={Users} label="Total Donors" value={formatNumber(s.totalDonors)} sub={`${s.totalDonations} donations`} tone="violet" />
              <StatsCard icon={Coins} label="Total Raised" value={formatINR(s.totalRaised)} tone="blue" />
              <StatsCard icon={HandCoins} label="Total Funds Allocated" value={formatINR(s.totalAllocated)} sub={`${formatINR(s.remainingFunds)} not yet allocated`} tone="teal" />
              <StatsCard icon={CheckCircle2} label="On-chain Transactions" value={formatNumber(s.totalTransactions)} sub="donations + allocations" tone="slate" />
            </div>

            <div className="card overflow-x-auto">
              <div className="border-b border-slate-100 px-5 py-4">
                <h3 className="font-bold text-slate-900">Campaign progress</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Campaign</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="w-1/4 px-5 py-3 font-semibold">Progress</th>
                    <th className="px-5 py-3 text-right font-semibold">Raised</th>
                    <th className="px-5 py-3 text-right font-semibold">Donors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {s.campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <Link to={`/campaigns/${c.id}`} className="font-semibold text-slate-800 hover:text-teal-700">{c.name}</Link>
                        <p className="text-xs text-slate-500">{c.location}</p>
                      </td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={c.progress} size="sm" />
                          <span className="w-12 text-right text-xs font-semibold text-slate-600">{c.progress}%</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold">
                        {formatINR(c.raisedAmount)} <span className="font-normal text-slate-400">/ {formatINR(c.targetAmount)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">{c.donorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <BlockchainStatus />
          </>
        )}
      </div>
    </>
  );
}
