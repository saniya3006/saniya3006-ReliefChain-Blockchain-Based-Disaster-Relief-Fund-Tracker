import { CalendarClock, CalendarDays, MapPin, Target, Users, Wallet } from "lucide-react";
import CampaignCover from "./CampaignCover";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import { daysLeft, formatDate, formatINR, formatNumber, shortHash } from "../utils/format";
import { disasterInfo } from "../utils/constants";

/** Header + key numbers for a single campaign. */
export default function CampaignDetails({ campaign: c }) {
  const Icon = disasterInfo(c.disasterType).icon;
  const left = daysLeft(c.deadline);

  const stats = [
    { icon: Target, label: "Target", value: formatINR(c.targetAmount) },
    { icon: Wallet, label: "Remaining to target", value: formatINR(c.remainingAmount) },
    { icon: Users, label: "Donors", value: formatNumber(c.donorCount), sub: `${c.donationCount} donations` },
    {
      icon: CalendarClock,
      label: "End date",
      value: formatDate(c.deadline),
      sub: c.status === "ACTIVE" ? `${left} days left` : null,
    },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="relative h-56 sm:h-72">
        <CampaignCover campaign={c} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800">
              <Icon className="h-3.5 w-3.5" /> {c.disasterType} Relief
            </span>
            <StatusBadge status={c.status} />
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
              Campaign #{c.id}
            </span>
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl">{c.name}</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-200">
            <MapPin className="h-4 w-4" /> {c.location}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Raised so far</p>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">{formatINR(c.raisedAmount)}</p>
          </div>
          <p className="text-2xl font-bold text-teal-700">{c.progress}%</p>
        </div>
        <div className="mt-3">
          <ProgressBar value={c.progress} size="lg" />
        </div>
        <p className="mt-2 text-sm text-slate-500">of {formatINR(c.targetAmount)} target</p>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: SIcon, label, value, sub }) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3.5">
              <SIcon className="h-4 w-4 text-slate-400" />
              <p className="mt-2 text-xs font-medium text-slate-500">{label}</p>
              <p className="font-bold text-slate-900">{value}</p>
              {sub && <p className="text-xs text-slate-500">{sub}</p>}
            </div>
          ))}
        </div>

        <h2 className="mt-7 font-bold text-slate-900">About this campaign</h2>
        <p className="mt-2 leading-relaxed text-slate-600">{c.description}</p>
        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Created {formatDate(c.createdAt)}
          </span>
          <span>
            Created by <code className="font-mono">{shortHash(c.creator, 8, 6)}</code>
          </span>
        </p>
      </div>
    </div>
  );
}
