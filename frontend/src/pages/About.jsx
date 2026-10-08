import { ArrowDown, Check, Monitor, Server, FileCode2, Boxes, User, X } from "lucide-react";
import BlockchainStatus from "../components/BlockchainStatus";
import PageHeader from "../components/PageHeader";

const FLOW = [
  { icon: User, title: "User / Admin", text: "Enters donor name + amount, or admin actions" },
  { icon: Monitor, title: "React website", text: "Vite + Tailwind UI, calls the REST API" },
  { icon: Server, title: "FastAPI backend", text: "Validates input, signs transactions with the owner wallet (web3.py)" },
  { icon: FileCode2, title: "ReliefChain smart contract", text: "Solidity rules: onlyOwner, valid IDs, no over-allocation" },
  { icon: Boxes, title: "Blockchain (Hardhat local)", text: "Permanent, tamper-evident record + transaction hashes" },
];

const CAN = [
  "Show every recorded donation and allocation publicly",
  "Make records tamper-evident: they cannot be secretly edited or deleted",
  "Let anyone independently verify a transaction by its hash",
  "Enforce rules in code, e.g. no allocation larger than donated funds",
];
const CANNOT = [
  "Prove that the relief organization itself is genuine",
  "Prove that goods were physically delivered to victims",
  "Stop the organization from recording a false note (it can only make it public and permanent)",
];

export default function About() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="How ReliefChain works"
        subtitle="A college mini-project: a blockchain-based application for transparent and genuine charity."
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Architecture</h2>
          <div className="mt-6 flex flex-col items-center">
            {FLOW.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="flex w-full max-w-md flex-col items-center">
                <div className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-700 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-500">{text}</p>
                  </div>
                </div>
                {i < FLOW.length - 1 && <ArrowDown className="my-1.5 h-5 w-5 text-slate-400" />}
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            <b>Example:</b> Rahul enters <b>₹500</b> for Flood Relief → backend calls <code>donate(1, "Rahul", 500)</code> →
            the smart contract stores <b>Rahul → ₹500 → Flood Relief</b> and emits a <code>DonationReceived</code> event →
            the transaction hash is shown to Rahul as a receipt.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="card p-6">
            <h3 className="font-bold text-slate-900">What blockchain gives us</h3>
            <ul className="mt-4 space-y-2.5">
              {CAN.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-slate-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-bold text-slate-900">What it cannot do on its own</h3>
            <ul className="mt-4 space-y-2.5">
              {CANNOT.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-slate-700">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /> {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              Organization verification (registration, audits, field reports) is an administrative, off-chain process.
            </p>
          </div>
        </section>

        <section className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-slate-900">Where data is stored</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Data</th>
                  <th className="py-2 pr-4">Stored in</th>
                  <th className="py-2">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr><td className="py-2.5 pr-4">Campaigns, targets, status</td><td className="pr-4 font-medium">Smart contract</td><td>Must be public and tamper-evident</td></tr>
                <tr><td className="py-2.5 pr-4">Donations (name, amount, time)</td><td className="pr-4 font-medium">Smart contract</td><td>Core financial record</td></tr>
                <tr><td className="py-2.5 pr-4">Allocations (category, amount, note)</td><td className="pr-4 font-medium">Smart contract</td><td>Core financial record</td></tr>
                <tr><td className="py-2.5 pr-4">Transaction hashes</td><td className="pr-4 font-medium">Blockchain (event logs)</td><td>Proof that each record exists</td></tr>
                <tr><td className="py-2.5 pr-4">Campaign images</td><td className="pr-4 font-medium">Local files (frontend/public)</td><td>Large files are too expensive for a blockchain</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-slate-500">No separate database is used: the smart contract is the single source of truth.</p>
        </section>

        <BlockchainStatus />
      </div>
    </>
  );
}
