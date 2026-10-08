import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";

export function Loader({ text = "Reading from the blockchain…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center gap-3 p-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-slate-900">Could not load data</h3>
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button onClick={() => onRetry()} className="btn-ghost mt-1">
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-slate-400" />
      <p className="font-semibold text-slate-700">{title}</p>
      {text && <p className="max-w-sm text-sm text-slate-500">{text}</p>}
      {children}
    </div>
  );
}
