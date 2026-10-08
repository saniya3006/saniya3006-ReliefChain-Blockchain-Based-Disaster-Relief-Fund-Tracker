import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { shortHash } from "../utils/format";
import { explorerTxUrl, useChainHealth } from "../utils/useChainHealth";

/** Shows a transaction hash with copy + "verify" actions. */
export default function TxHash({ hash, full = false, showVerify = true }) {
  const [copied, setCopied] = useState(false);
  const { health } = useChainHealth();
  const explorer = explorerTxUrl(health, hash);
  if (!hash) return <span className="text-xs text-slate-400">—</span>;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - ignore */
    }
  };

  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <code className={`font-mono text-xs text-slate-700 ${full ? "break-all" : ""}`} title={hash}>
        {full ? hash : shortHash(hash, 8, 6)}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        title="Copy hash"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      {showVerify && (
        <Link
          to={`/verify?tx=${hash}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-teal-700 hover:bg-teal-50"
          title="Verify on blockchain"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Verify
        </Link>
      )}
      {explorer && (
        <a
          href={explorer}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-sky-700 hover:bg-sky-50"
          title="Open on Etherscan"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Etherscan
        </a>
      )}
    </span>
  );
}
