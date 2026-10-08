import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { api } from "../utils/api";
import { categoryInfo } from "../utils/constants";
import { formatDateTime, formatINR } from "../utils/format";
import TxHash from "./TxHash";
import { explorerTxUrl, useChainHealth } from "../utils/useChainHealth";

/** Looks a transaction hash up directly on the blockchain (via the backend) and decodes it. */
export default function TransactionVerification() {
  const [params, setParams] = useSearchParams();
  const [hash, setHash] = useState(params.get("tx") || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const verify = async (h = hash) => {
    const value = h.trim();
    setError("");
    setResult(null);
    if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
      setError("Please enter a valid transaction hash: 0x followed by 64 hexadecimal characters.");
      return;
    }
    setLoading(true);
    setParams({ tx: value }, { replace: true });
    try {
      setResult(await api.verify(value));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when opened from a "Verify" link (?tx=0x...)
  useEffect(() => {
    const tx = params.get("tx");
    if (tx) verify(tx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <form
        className="card p-5 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault();
          verify();
        }}
      >
        <label className="label" htmlFor="txhash">Transaction hash</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="txhash"
            className="input font-mono"
            placeholder="0x83a7…"
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            spellCheck={false}
          />
          <button className="btn-primary shrink-0 px-6" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            VERIFY TRANSACTION
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Tip: click <b>Verify</b> next to any donation or allocation, or paste a hash from a donation receipt.
        </p>
      </form>

      {error && (
        <div className="card flex items-start gap-3 border-rose-200 bg-rose-50/60 p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-800">Verification failed</p>
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {result && <VerificationResult r={result} />}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function VerificationResult({ r }) {
  const confirmed = r.status === "Confirmed";
  const { health } = useChainHealth();
  const explorer = explorerTxUrl(health, r.txHash);
  return (
    <div className="card overflow-hidden">
      <div className={`flex items-center gap-3 px-5 py-4 ${confirmed ? "bg-emerald-50" : "bg-rose-50"}`}>
        {confirmed ? <CheckCircle2 className="h-7 w-7 text-emerald-600" /> : <XCircle className="h-7 w-7 text-rose-600" />}
        <div>
          <p className={`text-lg font-bold ${confirmed ? "text-emerald-800" : "text-rose-800"}`}>
            {confirmed ? "✓ Transaction Found" : "Transaction Found (failed / reverted)"}
          </p>
          <p className="text-sm text-slate-600">Fetched live from the blockchain, not from a database.</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!r.isReliefChain && (
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            This transaction exists, but it was not sent to the ReliefChain smart contract.
          </p>
        )}

        {r.events.map((ev, i) => (
          <div key={i} className="mb-4 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{ev.type} record</p>
            <dl className="mt-2 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Campaign</dt>
                <dd className="font-semibold text-slate-900">
                  {ev.campaignName} <span className="font-normal text-slate-400">#{ev.campaignId}</span>
                </dd>
              </div>
              {ev.type === "Donation" && (
                <>
                  <div>
                    <dt className="text-slate-500">Donation amount</dt>
                    <dd className="text-lg font-bold text-slate-900">{formatINR(ev.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Donor</dt>
                    <dd className="font-semibold text-slate-900">{ev.donorName}</dd>
                  </div>
                </>
              )}
              {ev.type === "Allocation" && (
                <>
                  <div>
                    <dt className="text-slate-500">Allocated amount</dt>
                    <dd className="text-lg font-bold text-slate-900">{formatINR(ev.amount)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Category</dt>
                    <dd className="font-semibold text-slate-900">{categoryInfo(ev.category).label}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Note</dt>
                    <dd className="text-slate-900">{ev.note || "-"}</dd>
                  </div>
                </>
              )}
              {ev.type === "Campaign Created" && (
                <div>
                  <dt className="text-slate-500">Target</dt>
                  <dd className="font-semibold text-slate-900">{formatINR(ev.amount)}</dd>
                </div>
              )}
              {ev.type === "Status Changed" && (
                <div>
                  <dt className="text-slate-500">New status</dt>
                  <dd className="font-semibold text-slate-900">{ev.status}</dd>
                </div>
              )}
            </dl>
          </div>
        ))}

        <dl className="divide-y divide-slate-100">
          <Row label="Status">
            <span className={confirmed ? "text-emerald-700" : "text-rose-700"}>{r.status}</span>
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({r.confirmations} confirmation{r.confirmations === 1 ? "" : "s"})
            </span>
          </Row>
          <Row label="Transaction hash">
            <TxHash hash={r.txHash} full showVerify={false} />
          </Row>
          <Row label="Block number"><span className="font-mono">#{r.blockNumber}</span></Row>
          <Row label="Timestamp">{formatDateTime(r.timestamp)}</Row>
          <Row label="Sent by (recording wallet)"><code className="break-all font-mono text-xs">{r.from}</code></Row>
          <Row label="Sent to (contract)"><code className="break-all font-mono text-xs">{r.to || "-"}</code></Row>
          <Row label="Gas used"><span className="font-mono">{r.gasUsed.toLocaleString()}</span></Row>
          {explorer && (
            <Row label="Public block explorer">
              <a href={explorer} target="_blank" rel="noreferrer" className="font-medium text-sky-700 hover:underline">
                View this transaction on Etherscan
              </a>
            </Row>
          )}
        </dl>
      </div>
    </div>
  );
}
