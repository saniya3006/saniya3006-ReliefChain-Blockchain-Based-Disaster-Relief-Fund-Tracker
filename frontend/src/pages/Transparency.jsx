import { Info } from "lucide-react";
import PageHeader from "../components/PageHeader";
import TransparencyDashboard from "../components/TransparencyDashboard";
import { ErrorState, Loader } from "../components/States";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";

export default function Transparency() {
  const { data, error, loading, reload } = useApi(() => api.stats(), []);
  return (
    <>
      <PageHeader
        eyebrow="Transparency"
        title="Transparency Dashboard"
        subtitle="Where the money came from and where it went: every number here is computed from records stored in the smart contract."
      />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            Blockchain gives a transparent, tamper-evident record of <b>recorded</b> donations and allocations. It does not
            by itself prove the organization is genuine or that goods were physically delivered. Those need off-chain
            checks such as registration, audits and receipts.
          </p>
        </div>
        {loading ? <Loader /> : error ? <ErrorState message={error} onRetry={reload} /> : <TransparencyDashboard stats={data} />}
      </div>
    </>
  );
}
