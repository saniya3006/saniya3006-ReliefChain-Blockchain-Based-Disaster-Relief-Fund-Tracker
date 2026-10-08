import { Link } from "react-router-dom";
import { Logo } from "./Navbar";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            A transparent, tamper-evident record of disaster-relief donations and fund allocations.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-slate-900">Explore</p>
          <div className="mt-3 grid gap-2 text-slate-600">
            <Link to="/campaigns" className="hover:text-teal-700">Campaigns</Link>
            <Link to="/transparency" className="hover:text-teal-700">Transparency</Link>
            <Link to="/verify" className="hover:text-teal-700">Verify a transaction</Link>
            <Link to="/about" className="hover:text-teal-700">How it works</Link>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          <p className="font-semibold text-slate-900">Important</p>
          <p className="mt-3">
            College mini-project. All campaigns, donors and amounts are <b>fictional demo data</b> on a test
            blockchain (local Hardhat or the Sepolia testnet). No real money is involved.
          </p>
          <p className="mt-2">
            Blockchain provides a transparent record of donations and allocations. It does not by itself prove that a
            charity is genuine.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        ReliefChain · React + FastAPI + Solidity (Ethereum)
      </div>
    </footer>
  );
}
