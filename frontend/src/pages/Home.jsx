import { Link } from "react-router-dom";
import {
  ArrowRight,
  Blocks,
  Eye,
  FileCheck2,
  HandCoins,
  HeartHandshake,
  PieChart,
  Search,
  ShieldCheck,
} from "lucide-react";
import CampaignCard from "../components/CampaignCard";
import { ErrorState, Loader } from "../components/States";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";
import { formatINR, formatNumber } from "../utils/format";

const STEPS = [
  { icon: HeartHandshake, title: "Donate", text: "Choose a campaign, enter your name and amount." },
  { icon: Blocks, title: "Recorded on blockchain", text: "The smart contract stores it with a unique transaction hash." },
  { icon: PieChart, title: "Allocation tracked", text: "Every rupee used for Food, Medicine, Shelter or Transport is recorded." },
  { icon: Search, title: "Anyone can verify", text: "Paste any transaction hash to check it directly on the chain." },
];

export default function Home() {
  const { data: stats, error, loading, reload } = useApi(() => api.stats(), []);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.22),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Every donation recorded on a blockchain
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Disaster relief you can <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">actually trace</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              ReliefChain records every donation and every fund allocation in a smart contract, so donors can see where
              their money went, and verify it themselves.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/campaigns" className="btn-accent px-6 py-3 text-base">
                Donate to a campaign <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/transparency" className="btn border border-white/20 bg-white/5 px-6 py-3 text-base text-white hover:bg-white/10">
                <Eye className="h-4 w-4" /> See where funds go
              </Link>
            </div>
          </div>

          {/* Live numbers */}
          <div className="grid content-center gap-4 sm:grid-cols-2">
            {[
              { label: "Total raised", value: stats ? formatINR(stats.totalRaised) : "—", icon: HandCoins },
              { label: "Funds allocated", value: stats ? formatINR(stats.totalAllocated) : "—", icon: PieChart },
              { label: "Active campaigns", value: stats ? formatNumber(stats.activeCampaigns) : "—", icon: HeartHandshake },
              { label: "On-chain transactions", value: stats ? formatNumber(stats.totalTransactions) : "—", icon: FileCheck2 },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <Icon className="h-5 w-5 text-teal-300" />
                <p className="mt-3 text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-slate-400">{label}</p>
              </div>
            ))}
            <p className="text-xs text-slate-500 sm:col-span-2">
              Live values read from the ReliefChain smart contract on the local Hardhat blockchain (demo data).
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">How ReliefChain works</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card relative p-6">
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-slate-100">{i + 1}</span>
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Campaigns */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Active relief campaigns</h2>
            <p className="mt-1 text-slate-600">Fictional demonstration campaigns for this project.</p>
          </div>
          <Link to="/campaigns" className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:underline sm:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8">
          {loading ? (
            <Loader />
          ) : error ? (
            <ErrorState message={error} onRetry={reload} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stats.campaigns
                .filter((c) => c.status === "ACTIVE")
                .slice(0, 3)
                .map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Honest principle */}
      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 p-8 text-white sm:p-12">
          <ShieldCheck className="h-8 w-8 text-teal-200" />
          <p className="mt-4 max-w-3xl text-xl font-semibold leading-relaxed sm:text-2xl">
            "Blockchain does not automatically prove that a charity organization is genuine. It provides a transparent
            and tamper-evident record of donations and fund allocations."
          </p>
          <p className="mt-4 max-w-3xl text-teal-100">
            Verifying the organization itself is an administrative, off-chain process. What ReliefChain guarantees is that
            once a donation or allocation is recorded, nobody can secretly edit or delete it, and anyone can check it.
          </p>
          <Link to="/about" className="mt-6 inline-flex items-center gap-1 font-semibold text-white hover:underline">
            Learn how it works <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
