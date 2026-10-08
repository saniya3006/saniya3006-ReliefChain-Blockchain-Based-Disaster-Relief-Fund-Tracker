import { useState } from "react";
import toast from "react-hot-toast";
import { Ban, CheckCircle2, KeyRound, LayoutList, Loader2, LogOut, PieChart, PlusCircle } from "lucide-react";
import { api } from "../utils/api";
import { useApi } from "../utils/useApi";
import { CATEGORIES, COVER_IMAGES, DISASTER_TYPES } from "../utils/constants";
import { formatINR } from "../utils/format";
import BlockchainStatus from "./BlockchainStatus";
import StatusBadge from "./StatusBadge";
import TxHash from "./TxHash";
import { ErrorState, Loader } from "./States";

const KEY_STORAGE = "reliefchain-admin-key";

function readKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

/** Admin dashboard. Every action is a real smart-contract transaction sent by the backend's owner wallet. */
export default function AdminPanel() {
  const [adminKey, setAdminKey] = useState(readKey);

  const logout = () => {
    try {
      sessionStorage.removeItem(KEY_STORAGE);
    } catch {
      /* ignore */
    }
    setAdminKey("");
  };

  if (!adminKey) return <AdminLogin onLogin={setAdminKey} />;
  return <AdminDashboard adminKey={adminKey} onLogout={logout} />;
}

function AdminLogin({ onLogin }) {
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.adminLogin(key);
      try {
        sessionStorage.setItem(KEY_STORAGE, key);
      } catch {
        /* ignore */
      }
      onLogin(key);
      toast.success("Welcome, admin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md p-7">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-teal-50 text-teal-700">
        <KeyRound className="h-6 w-6" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Admin login</h2>
      <p className="mt-1 text-sm text-slate-500">
        For the relief organization only. The key is set as <code>ADMIN_KEY</code> in <code>backend/.env</code>.
      </p>
      <label className="label mt-5" htmlFor="adminkey">Admin key</label>
      <input id="adminkey" type="password" className="input" value={key} onChange={(e) => setKey(e.target.value)} />
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <button className="btn-primary mt-5 w-full" disabled={loading || !key}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />} Log in
      </button>
    </form>
  );
}

const TABS = [
  { key: "campaigns", label: "Campaigns", icon: LayoutList },
  { key: "create", label: "Create Campaign", icon: PlusCircle },
  { key: "allocate", label: "Allocate Funds", icon: PieChart },
];

function AdminDashboard({ adminKey, onLogout }) {
  const [tab, setTab] = useState("campaigns");
  const { data: campaigns, error, loading, reload } = useApi(() => api.campaigns(), []);
  const [lastTx, setLastTx] = useState(null);

  // Admin key rejected (e.g. changed in .env) -> log out
  const handleError = (err) => {
    toast.error(err.message);
    if (err.message.startsWith("Unauthorized")) onLogout();
  };
  const done = (res) => {
    setLastTx(res);
    toast.success(res.message);
    reload(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`btn ${tab === key ? "bg-teal-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="btn-ghost">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>

      {lastTx && (
        <div className="card flex flex-wrap items-center gap-3 border-emerald-200 bg-emerald-50/60 p-4 text-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="font-medium text-emerald-900">{lastTx.message}</span>
          <span className="text-emerald-800">block #{lastTx.blockNumber}</span>
          <TxHash hash={lastTx.txHash} />
        </div>
      )}

      {loading ? (
        <Loader />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {tab === "campaigns" && (
            <CampaignTable campaigns={campaigns} adminKey={adminKey} onDone={done} onError={handleError} />
          )}
          {tab === "create" && (
            <CreateCampaignForm
              adminKey={adminKey}
              onDone={(r) => {
                done(r);
                setTab("campaigns");
              }}
              onError={handleError}
            />
          )}
          {tab === "allocate" && (
            <AllocateForm campaigns={campaigns} adminKey={adminKey} onDone={done} onError={handleError} />
          )}
        </>
      )}

      <BlockchainStatus />
    </div>
  );
}

function CampaignTable({ campaigns, adminKey, onDone, onError }) {
  const [busyId, setBusyId] = useState(null);

  const close = async (c) => {
    if (!window.confirm(`Close "${c.name}"? It will stop accepting donations. This is recorded permanently on the blockchain.`)) return;
    setBusyId(c.id);
    try {
      onDone(await api.closeCampaign(adminKey, c.id));
    } catch (e) {
      onError(e);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3 font-semibold">#</th>
            <th className="px-5 py-3 font-semibold">Campaign</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 text-right font-semibold">Raised / Target</th>
            <th className="px-5 py-3 text-right font-semibold">Allocated</th>
            <th className="px-5 py-3 text-right font-semibold">Available</th>
            <th className="px-5 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <tr key={c.id}>
              <td className="px-5 py-3 text-slate-400">{c.id}</td>
              <td className="px-5 py-3">
                <p className="font-semibold text-slate-800">{c.name}</p>
                <p className="text-xs text-slate-500">{c.disasterType} · {c.location}</p>
              </td>
              <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
              <td className="whitespace-nowrap px-5 py-3 text-right">
                {formatINR(c.raisedAmount)} <span className="text-slate-400">/ {formatINR(c.targetAmount)}</span>
              </td>
              <td className="whitespace-nowrap px-5 py-3 text-right">{formatINR(c.allocatedAmount)}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-orange-600">{formatINR(c.availableAmount)}</td>
              <td className="px-5 py-3">
                <button
                  className="btn-ghost px-3 py-1.5 text-xs text-rose-700"
                  disabled={busyId === c.id || c.status === "CLOSED"}
                  onClick={() => close(c)}
                  title={c.status === "CLOSED" ? "Already closed" : "Close campaign"}
                >
                  {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                  Close
                </button>
              </td>
            </tr>
          ))}
          {campaigns.length === 0 && (
            <tr>
              <td colSpan={7} className="px-5 py-8 text-center text-slate-500">No campaigns yet. Create one.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function defaultEndDate() {
  const d = new Date(Date.now() + 30 * 86400000);
  return d.toISOString().slice(0, 10);
}

function CreateCampaignForm({ adminKey, onDone, onError }) {
  const [form, setForm] = useState({
    name: "",
    disaster_type: "Flood",
    location: "",
    description: "",
    image_url: "/images/flood.svg",
    target_amount: "",
    end_date: defaultEndDate(),
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const submit = async (e) => {
    e.preventDefault();
    const target = Number(form.target_amount);
    if (!Number.isInteger(target) || target <= 0) return toast.error("Target must be a whole rupee amount above 0");
    if (form.end_date <= today) return toast.error("End date must be in the future");
    setLoading(true);
    try {
      onDone(await api.createCampaign(adminKey, { ...form, target_amount: target }));
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
      <div className="sm:col-span-2">
        <h2 className="text-lg font-bold text-slate-900">Create a new campaign</h2>
        <p className="text-sm text-slate-500">Text fields and target are stored in the smart contract. The image file stays local.</p>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Campaign name</label>
        <input className="input" required maxLength={100} placeholder="e.g. Kerala Flood Relief 2026" value={form.name} onChange={set("name")} />
      </div>
      <div>
        <label className="label">Disaster type</label>
        <select
          className="input"
          value={form.disaster_type}
          onChange={(e) => {
            const t = DISASTER_TYPES.find((d) => d.key === e.target.value);
            setForm((f) => ({ ...f, disaster_type: e.target.value, image_url: t.image }));
          }}
        >
          {DISASTER_TYPES.map((d) => (
            <option key={d.key}>{d.key}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Location</label>
        <input className="input" required maxLength={100} placeholder="City, State" value={form.location} onChange={set("location")} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Description</label>
        <textarea className="input min-h-24" required maxLength={1000} value={form.description} onChange={set("description")} />
      </div>
      <div>
        <label className="label">Target amount (₹)</label>
        <input className="input" type="number" min="1" step="1" required placeholder="1000000" value={form.target_amount} onChange={set("target_amount")} />
        {Number(form.target_amount) > 0 && <p className="mt-1 text-xs text-slate-500">{formatINR(form.target_amount)}</p>}
      </div>
      <div>
        <label className="label">End date</label>
        <input className="input" type="date" min={today} required value={form.end_date} onChange={set("end_date")} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Campaign image</label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {COVER_IMAGES.map((img) => (
            <button
              type="button"
              key={img.url}
              onClick={() => setForm((f) => ({ ...f, image_url: img.url }))}
              className={`overflow-hidden rounded-xl border-2 transition ${form.image_url === img.url ? "border-teal-600 ring-4 ring-teal-600/10" : "border-transparent opacity-80 hover:opacity-100"}`}
            >
              <img src={img.url} alt={img.label} className="h-16 w-full object-cover" />
              <p className="bg-white py-1 text-[11px] font-medium text-slate-600">{img.label}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <button className="btn-primary w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
          {loading ? "Writing to blockchain…" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}

function AllocateForm({ campaigns, adminKey, onDone, onError }) {
  const withFunds = campaigns.filter((c) => c.availableAmount > 0);
  const [campaignId, setCampaignId] = useState(withFunds[0]?.id ?? campaigns[0]?.id ?? "");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = campaigns.find((c) => c.id === Number(campaignId));
  const available = selected?.availableAmount ?? 0;

  const submit = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!selected) return toast.error("Choose a campaign");
    if (!Number.isInteger(value) || value <= 0) return toast.error("Enter a whole rupee amount above 0");
    // The smart contract enforces this too; checking here just gives faster feedback.
    if (value > available) return toast.error(`Only ${formatINR(available)} is available to allocate`);
    setLoading(true);
    try {
      onDone(await api.allocate(adminKey, selected.id, { category, amount: value, note }));
      setAmount("");
      setNote("");
    } catch (err) {
      onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (campaigns.length === 0) return <p className="card p-6 text-sm text-slate-500">Create a campaign first.</p>;

  return (
    <form onSubmit={submit} className="card grid gap-5 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Record a fund allocation</h2>
        <p className="text-sm text-slate-500">
          The smart contract rejects any allocation larger than the campaign's unallocated funds.
        </p>
      </div>
      <div>
        <label className="label">Campaign</label>
        <select className="input" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.id} {c.name} ({formatINR(c.availableAmount)} available)
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center text-sm">
          <div><p className="text-xs text-slate-500">Raised</p><p className="font-bold">{formatINR(selected.raisedAmount)}</p></div>
          <div><p className="text-xs text-slate-500">Allocated</p><p className="font-bold text-teal-700">{formatINR(selected.allocatedAmount)}</p></div>
          <div><p className="text-xs text-slate-500">Available</p><p className="font-bold text-orange-600">{formatINR(available)}</p></div>
        </div>
      )}
      <div>
        <label className="label">Category</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            return (
              <button
                type="button"
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  category === c.key ? "border-teal-600 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" /> {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label">Amount (₹)</label>
          <input className="input" type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button type="button" className="mt-1 text-xs font-medium text-teal-700 hover:underline" onClick={() => setAmount(String(available))}>
            Use all available ({formatINR(available)})
          </button>
        </div>
        <div>
          <label className="label">Note (what was it used for?)</label>
          <input className="input" maxLength={200} placeholder="e.g. 500 food packets" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div>
        <button className="btn-primary" disabled={loading || available === 0}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PieChart className="h-4 w-4" />}
          {loading ? "Writing to blockchain…" : "Allocate funds"}
        </button>
      </div>
    </form>
  );
}
