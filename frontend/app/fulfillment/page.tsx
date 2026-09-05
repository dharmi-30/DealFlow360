'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Button,
  Badge,
  Table,
} from '@/components/ui';
import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import { MOCK_FULFILLMENT_DATA } from '@/data/mockFulfillmentData';
import { formatCurrency } from '@/lib/utils';
import { Truck, Building2, Package, ArrowRight, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export default function FulfillmentListPage() {
  const quotations = MOCK_QUOTATIONS;

  return (
    <AppShell title="Fulfillment Center" subtitle="Warehouse & Logistics Allocation Command Center">
      <PageHeader
        title="Fulfillment & Warehouse Operations"
        subtitle="Manage stock allocation, multi-warehouse splits & backorders across active quotations"
      />

      <div className="space-y-6">
        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Active Orders</span>
            <div className="text-lg font-extrabold text-slate-100">{quotations.length}</div>
            <span className="text-[10px] text-slate-500">Quotations requiring allocation</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Allocated & Ready</span>
            <div className="text-lg font-extrabold text-emerald-400">2</div>
            <span className="text-[10px] text-slate-500">100% warehouse stock assigned</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Split Review</span>
            <div className="text-lg font-extrabold text-amber-400">2</div>
            <span className="text-[10px] text-slate-500">Awaiting split confirmation</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Backordered Items</span>
            <div className="text-lg font-extrabold text-red-400">1</div>
            <span className="text-[10px] text-slate-500">30 units awaiting replenishment</span>
          </GlassCard>
        </div>

        {/* FULFILLMENT QUEUE TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Active Fulfillment Orders
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{quotations.length} Orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Quote Ref</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Order Value</th>
                  <th className="py-2.5 px-3">Warehouse Hub</th>
                  <th className="py-2.5 px-3 text-center">Fulfillment Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {quotations.map((q) => {
                  const fulData = MOCK_FULFILLMENT_DATA[q.id];
                  const status = fulData ? fulData.status : q.fulfillmentDetails.status;
                  const warehouse = q.fulfillmentDetails.warehouseName;

                  return (
                    <tr key={q.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">{q.number}</td>
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-100 block">{q.customerName}</span>
                        <span className="text-[10px] text-slate-400">{q.companyName}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-extrabold font-mono text-slate-200">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>{warehouse}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            status === 'fulfilled' || status === 'allocated'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : status === 'backordered'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {status === 'fulfilled' || status === 'allocated' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : status === 'backordered' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Link href={`/fulfillment/${q.id}`}>
                          <Button variant="secondary" size="sm" className="gap-1 text-xs">
                            <span>Manage Split</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
