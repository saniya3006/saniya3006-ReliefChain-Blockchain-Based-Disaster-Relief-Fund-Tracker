export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <div className="border-b border-slate-200/80 bg-gradient-to-b from-teal-50/60 to-transparent">
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
        <div className="max-w-2xl">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">{eyebrow}</p>}
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
