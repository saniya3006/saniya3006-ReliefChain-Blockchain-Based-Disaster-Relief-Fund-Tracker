import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CampaignDetails from "../components/CampaignDetails";
import DonationForm from "../components/DonationForm";
import DonationHistory from "../components/DonationHistory";
import FundAllocation from "../components/FundAllocation";
import { ErrorState, Loader } from "../components/States";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";

export default function CampaignPage() {
  const { id } = useParams();
  const valid = /^\d+$/.test(id);
  const { data, error, loading, reload } = useApi(
    () => (valid ? api.campaign(id) : Promise.reject(new Error("Invalid campaign ID"))),
    [id]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Link to="/campaigns" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> All campaigns
      </Link>

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} onRetry={error === "Invalid campaign ID" ? undefined : reload} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2">
            <CampaignDetails campaign={data} />
          </div>
          {/* Donation form: right after the header on phones, sticky sidebar on desktop */}
          <div className="min-w-0 lg:row-span-3">
            <div className="lg:sticky lg:top-24">
              <DonationForm campaign={data} onDonated={() => reload(true)} />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-2">
            <FundAllocation campaign={data} allocations={data.allocations} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <DonationHistory donations={data.donations} />
          </div>
        </div>
      )}
    </div>
  );
}
