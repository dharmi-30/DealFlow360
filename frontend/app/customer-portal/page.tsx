'use client';

import * as React from 'react';
import Link from 'next/link';
import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Building2, ArrowRight, FileText, CheckCircle2, Clock } from 'lucide-react';
import { Button, GlassCard, Badge } from '@/components/ui';

export default function CustomerPortalLandingPage() {
  const quotes = MOCK_QUOTATIONS;

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* HEADER */}
      <header className="border-b border-white/10 bg-[#090e1c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-black text-lg">
              D
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                DealFlow360 <span className="text-xs font-medium text-slate-400">Customer Access Portal</span>
              </span>
              <p className="text-[11px] text-slate-400">B2B Commercial Proposals Directory</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-100">Your Commercial Proposals</h1>
          <p className="text-xs text-slate-400">
            Review active B2B quotations, request price or quantity adjustments, and confirm order placement.
          </p>
        </div>

        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Active Proposals ({quotes.length})
            </h3>
          </div>

          <div className="divide-y divide-white/5">
            {quotes.map((q) => (
              <div key={q.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-cyan-400 text-sm">{q.number}</span>
                    <span className="text-xs text-slate-300 font-semibold">— {q.customerName}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Issued: {formatDate(q.createdAt)} | Valid Until: {formatDate(q.validUntil)}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Total Amount</span>
                    <span className="font-extrabold text-slate-100 font-mono text-sm">
                      {formatCurrency(q.totalAmount)}
                    </span>
                  </div>

                  <Link href={`/portal/quotes/${q.id}`}>
                    <Button variant="primary" size="sm" className="gap-1 text-xs">
                      <span>Review Proposal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
