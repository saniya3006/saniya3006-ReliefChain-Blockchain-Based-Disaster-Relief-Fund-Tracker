import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Users } from "lucide-react";
import CampaignCover from "./CampaignCover";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import { daysLeft, formatINR, formatNumber } from "../utils/format";
import { disasterInfo } from "../utils/constants";

export default function CampaignCard({ campaign: c }) {
  const Icon = disasterInfo(c.disasterType).icon;
  const left = daysLeft(c.deadline);
  return (
    <Link
      to={`/campaigns/${c.id}`}
      className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5"
    >
      <div className="relative h-44 overflow-hidden">
        <CampaignCover campaign={c} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 backdrop-blur">
            <Icon className="h-3.5 w-3.5" /> {c.disasterType}
          </span>
          <StatusBadge status={c.status} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-slate-900 group-hover:text-teal-700">{c.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{c.location}</span>
        </p>
        <p className="mt-3 line-clamp-2 text-sm text-slate-600">{c.description}</p>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">{formatINR(c.raisedAmount)}</p>
              <p className="text-xs text-slate-500">raised of {formatINR(c.targetAmount)}</p>
            </div>
            <p className="text-sm font-semibold text-teal-700">{c.progress}%</p>
          </div>
          <ProgressBar value={c.progress} />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {formatNumber(c.donorCount)} donors
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="h-3.5 w-3.5" />
              {c.status === "ACTIVE" ? `${left} day${left === 1 ? "" : "s"} left` : "Not accepting donations"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
