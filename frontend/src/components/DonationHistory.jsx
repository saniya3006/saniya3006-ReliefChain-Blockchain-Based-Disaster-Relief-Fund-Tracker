import { History, UserRound } from "lucide-react";
import { formatDateTime, formatINR } from "../utils/format";
import { EmptyState } from "./States";
import TxHash from "./TxHash";

export default function DonationHistory({ donations = [] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="flex items-center gap-2 font-bold text-slate-900">
          <History className="h-5 w-5 text-teal-700" /> Donation History
        </h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {donations.length} on-chain
        </span>
      </div>

      {donations.length === 0 ? (
        <div className="p-5">
          <EmptyState title="No donations yet" text="Be the first to support this campaign." />
        </div>
      ) : (
        <div className="max-h-[480px] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Donor</th>
                <th className="px-5 py-2.5 text-right font-semibold">Amount</th>
                <th className="hidden px-5 py-2.5 font-semibold md:table-cell">Date</th>
                <th className="px-5 py-2.5 font-semibold">Transaction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {donations.map((d) => (
                <tr key={d.index} className="hover:bg-slate-50/70">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{d.donorName}</p>
                        <p className="text-xs text-slate-400 md:hidden">{formatDateTime(d.timestamp)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                    {formatINR(d.amount)}
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-3 text-slate-500 md:table-cell">
                    {formatDateTime(d.timestamp)}
                  </td>
                  <td className="px-5 py-3">
                    <TxHash hash={d.txHash} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
