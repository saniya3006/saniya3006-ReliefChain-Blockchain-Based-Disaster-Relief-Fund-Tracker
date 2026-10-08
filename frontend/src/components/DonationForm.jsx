import { useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, HeartHandshake, Loader2, Lock } from "lucide-react";
import { api } from "../utils/api";
import { QUICK_AMOUNTS } from "../utils/constants";
import { formatINR } from "../utils/format";
import TxHash from "./TxHash";

/**
 * Donor enters name + amount -> backend -> smart contract donate() -> blockchain.
 * The transaction hash returned here comes from the real mined transaction.
 */
export default function DonationForm({ campaign, onDonated }) {
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const accepting = campaign.status === "ACTIVE";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const donorName = anonymous ? "Anonymous" : name.trim();
    const value = Number(amount);
    if (!donorName) return setError("Please enter your name or choose to donate anonymously.");
    if (!Number.isInteger(value) || value <= 0) return setError("Enter a whole rupee amount greater than ₹0.");
    if (value > 10000000) return setError("Maximum donation in this demo is ₹1,00,00,000.");

    setLoading(true);
    try {
      const res = await api.donate(campaign.id, donorName, value);
      setReceipt({ ...res, donorName, amount: value });
      toast.success("Donation recorded on the blockchain!");
      setAmount("");
      onDonated?.();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <div className="card p-6">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="mt-3 text-xl font-bold text-slate-900">Donation Successful ✓</h3>
          <p className="mt-1 text-sm text-slate-600">
            {receipt.donorName} donated <b>{formatINR(receipt.amount)}</b> to {campaign.name}
          </p>
        </div>
        <dl className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Transaction hash</dt>
            <dd className="mt-1">
              <TxHash hash={receipt.txHash} full />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Block number</dt>
            <dd className="font-mono font-medium">#{receipt.blockNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Gas used</dt>
            <dd className="font-mono font-medium">{receipt.gasUsed.toLocaleString()}</dd>
          </div>
        </dl>
        <button className="btn-ghost mt-4 w-full" onClick={() => setReceipt(null)}>
          Make another donation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card p-6">
      <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <HeartHandshake className="h-5 w-5 text-orange-500" /> Make a donation
      </h3>

      {!accepting ? (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          This campaign is <b>{campaign.status.toLowerCase()}</b>
          {campaign.deadlinePassed && campaign.status === "CLOSED" ? " (deadline passed)" : ""} and is no longer
          accepting donations. Its full donation and allocation history remains publicly visible below.
        </p>
      ) : (
        <>
          <div className="mt-5">
            <label className="label" htmlFor="donor">Your name</label>
            <input
              id="donor"
              className="input"
              placeholder="e.g. Rahul"
              maxLength={64}
              value={anonymous ? "Anonymous" : name}
              disabled={anonymous || loading}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-teal-700"
                checked={anonymous}
                disabled={loading}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Donate anonymously
            </label>
          </div>

          <div className="mt-4">
            <label className="label" htmlFor="amount">Donation amount (₹)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                id="amount"
                className="input pl-8 text-lg font-semibold"
                type="number"
                min="1"
                step="1"
                placeholder="500"
                value={amount}
                disabled={loading}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  type="button"
                  key={a}
                  disabled={loading}
                  onClick={() => setAmount(String(a))}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    Number(amount) === a
                      ? "border-teal-600 bg-teal-50 text-teal-800"
                      : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {formatINR(a)}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button type="submit" className="btn-accent mt-5 w-full py-3 text-base" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Recording on blockchain…
              </>
            ) : (
              <>DONATE NOW{Number(amount) > 0 ? ` · ${formatINR(amount)}` : ""}</>
            )}
          </button>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Demo only, no real money. Your donation is written to the ReliefChain smart contract and gets a permanent
            transaction hash you can verify.
          </p>
        </>
      )}
    </form>
  );
}
