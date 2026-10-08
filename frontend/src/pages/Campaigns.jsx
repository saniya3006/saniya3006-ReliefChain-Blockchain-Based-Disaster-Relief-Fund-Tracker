import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import CampaignCard from "../components/CampaignCard";
import PageHeader from "../components/PageHeader";
import { EmptyState, ErrorState, Loader } from "../components/States";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";

const FILTERS = ["ALL", "ACTIVE", "COMPLETED", "CLOSED"];

export default function Campaigns() {
  const { data, error, loading, reload } = useApi(() => api.campaigns(), []);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data
      .filter((c) => filter === "ALL" || c.status === filter)
      .filter((c) => !q || [c.name, c.location, c.disasterType].some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => (a.status === "ACTIVE" ? 0 : 1) - (b.status === "ACTIVE" ? 0 : 1) || b.id - a.id);
  }, [data, filter, query]);

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Disaster relief campaigns"
        subtitle="All campaign data below is read live from the ReliefChain smart contract. (Fictional demo campaigns.)"
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                  filter === f ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search name, place, type…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState icon={SearchX} title="No campaigns found" text="Try a different filter or search term." />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
