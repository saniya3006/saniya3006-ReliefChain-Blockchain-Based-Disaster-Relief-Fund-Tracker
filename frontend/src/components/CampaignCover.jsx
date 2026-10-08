import { useState } from "react";
import { disasterInfo } from "../utils/constants";

/** Campaign image (local file from /public/images) with an icon fallback. */
export default function CampaignCover({ campaign, className = "" }) {
  const [failed, setFailed] = useState(false);
  const info = disasterInfo(campaign.disasterType);
  const src = campaign.imageUrl || info.image;
  const Icon = info.icon;

  if (failed || !src) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-teal-700 to-slate-800 ${className}`}>
        <Icon className="h-12 w-12 text-white/70" />
      </div>
    );
  }
  return <img src={src} alt={campaign.name} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}
