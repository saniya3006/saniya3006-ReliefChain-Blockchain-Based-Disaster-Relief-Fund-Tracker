import { Boxes, FileCode2, Wallet } from "lucide-react";
import { useChainHealth } from "../utils/useChainHealth";
import { shortHash } from "../utils/format";

/** Compact pill for the navbar. */
export function ChainPill() {
  const { health, error } = useChainHealth();
  const ok = health && !error;
  return (
    <div
      className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:inline-flex ${
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-700"
      }`}
      title={ok ? `Contract ${health.contractAddress}` : error || "Connecting…"}
    >
      <span className={`h-2 w-2 rounded-full ${ok ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
      {ok ? (
        <>
          Hardhat Local · <span className="font-mono">#{health.blockNumber}</span>
        </>
      ) : error ? (
        "Blockchain offline"
      ) : (
        "Connecting…"
      )}
    </div>
  );
}

/** Full card showing network, contract and recording wallet. */
export default function BlockchainStatus() {
  const { health, error } = useChainHealth();

  if (error) {
    return (
      <div className="card border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-800">
        <p className="font-semibold">Blockchain not connected</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }
  if (!health) return <div className="card h-[132px] animate-pulse bg-slate-50" />;

  const rows = [
    { icon: Boxes, label: "Network", value: `Hardhat Local (chain ${health.chainId}) · block #${health.blockNumber}` },
    { icon: FileCode2, label: "Smart contract", value: health.contractAddress, mono: true },
    { icon: Wallet, label: "Recording wallet (owner)", value: health.backendWallet, mono: true },
  ];
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Live blockchain connection</p>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Connected
        </span>
      </div>
      <dl className="space-y-2.5">
        {rows.map(({ icon: Icon, label, value, mono }) => (
          <div key={label} className="flex items-start gap-3 text-sm">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <dt className="w-44 shrink-0 text-slate-500">{label}</dt>
            <dd className={`min-w-0 break-all text-slate-800 ${mono ? "font-mono text-xs leading-5" : ""}`}>
              <span className="hidden md:inline">{value}</span>
              <span className="md:hidden">{mono ? shortHash(value, 10, 8) : value}</span>
            </dd>
          </div>
        ))}
      </dl>
      {!health.backendIsOwner && (
        <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          Warning: the backend wallet is not the contract owner, so write actions will be rejected.
        </p>
      )}
    </div>
  );
}
