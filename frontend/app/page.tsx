import Link from 'next/link';
import { Zap, CheckCircle, ArrowRight, GitBranch, FileText, BarChart2, Package } from 'lucide-react';
import { config } from '@/lib/config';

const MODULES = [
  { icon: GitBranch,  label: 'Sales Pipeline',    href: '/pipeline' },
  { icon: FileText,   label: 'Quotations',         href: '/quotations' },
  { icon: Package,    label: 'Fulfillment',        href: '/fulfillment' },
  { icon: BarChart2,  label: 'Reports',            href: '/reports' },
] as const;

interface StatusItem {
  label: string;
  ok: boolean;
  note?: string;
}

const STATUS_ITEMS: StatusItem[] = [
  { label: 'Next.js App Router',        ok: true },
  { label: 'TypeScript',                ok: true },
  { label: 'Tailwind CSS v4',           ok: true },
  { label: 'API config loaded',         ok: true },
  { label: `API URL: ${config.apiUrl}`, ok: true },
  { label: 'FastAPI backend',           ok: false, note: 'Phase 2' },
  { label: 'Authentication',            ok: false, note: 'Phase 2' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#0a0f1e] px-6 py-16">
      {/* Logo mark */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/30 shadow-lg shadow-cyan-500/5">
          <Zap className="h-7 w-7 text-cyan-400" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            DealFlow<span className="text-cyan-400">360</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            B2B Sales Operations Platform — Frontend Foundation
          </p>
        </div>
      </div>

      {/* Status card */}
      <div className="w-full max-w-md rounded-xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          System Status
        </p>
        <ul className="space-y-2.5">
          {STATUS_ITEMS.map(({ label, ok, note }) => (
            <li key={label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle
                  className={`h-4 w-4 shrink-0 ${ok ? 'text-emerald-400' : 'text-slate-700'}`}
                  strokeWidth={2}
                />
                <span className={`text-sm ${ok ? 'text-slate-300' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
              {note && (
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                  {note}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Module links */}
      <div className="mt-8 w-full max-w-md">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
          Modules (coming soon)
        </p>
        <div className="grid grid-cols-2 gap-2">
          {MODULES.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-slate-500 transition-all duration-150 hover:border-white/[0.10] hover:bg-white/[0.05] hover:text-slate-300"
            >
              <Icon className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-cyan-500" strokeWidth={1.5} />
              <span className="truncate">{label}</span>
              <ArrowRight className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-10 text-xs text-slate-700">
        Phase 1 — Frontend only · No backend connected
      </p>
    </div>
  );
}
