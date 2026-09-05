'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, LayoutGrid, ListFilter, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Button,
  StatusBadge,
  RiskIndicator,
  Avatar,
} from '@/components/ui';
import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { QuotationStatus, RiskLevel } from '@/types';

// Kanban Stage Columns Config
const KANBAN_COLUMNS: { id: QuotationStatus; title: string; color: string }[] = [
  { id: 'draft', title: 'Draft', color: 'border-t-slate-500' },
  { id: 'pending_approval', title: 'Pending Approval', color: 'border-t-amber-500' },
  { id: 'negotiation', title: 'Negotiation', color: 'border-t-violet-500' },
  { id: 'approved', title: 'Approved', color: 'border-t-emerald-500' },
  { id: 'accepted', title: 'Confirmed', color: 'border-t-cyan-500' },
];

export default function PipelinePage() {
  const router = useRouter();

  const [search, setSearch] = React.useState('');
  const [salesRepFilter, setSalesRepFilter] = React.useState('all');
  const [riskFilter, setRiskFilter] = React.useState('all');

  // Filtered list of deals
  const filteredDeals = React.useMemo(() => {
    return MOCK_QUOTATIONS.filter((q) => {
      const matchesSearch =
        q.number.toLowerCase().includes(search.toLowerCase()) ||
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.salesRep.name.toLowerCase().includes(search.toLowerCase());

      const matchesRep = salesRepFilter === 'all' || q.salesRep.name === salesRepFilter;
      const matchesRisk = riskFilter === 'all' || q.riskLevel === riskFilter;

      return matchesSearch && matchesRep && matchesRisk;
    });
  }, [search, salesRepFilter, riskFilter]);

  // Unique list of sales reps
  const uniqueSalesReps = Array.from(new Set(MOCK_QUOTATIONS.map((q) => q.salesRep.name)));

  return (
    <AppShell title="Sales Pipeline" subtitle="Opportunity Stages & Deal Progress">
      <PageHeader
        title="Sales Pipeline Kanban"
        subtitle="Track commercial deal progression from draft proposals to confirmed contracts"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/quotations">
              <Button variant="outline" size="sm">
                <ListFilter className="h-3.5 w-3.5" />
                <span>Table View</span>
              </Button>
            </Link>
            <Button variant="primary" size="sm" onClick={() => router.push('/quotation-builder')}>
              <Plus className="h-3.5 w-3.5" />
              <span>Create Proposal</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Filter Controls Bar */}
        <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 w-full">
            <div className="w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search deal, quote #, account..."
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Sales Reps' },
                  ...uniqueSalesReps.map((rep) => ({ value: rep, label: rep })),
                ]}
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Risk Levels' },
                  { value: 'low', label: 'Low Risk' },
                  { value: 'medium', label: 'Medium Risk' },
                  { value: 'high', label: 'High Risk' },
                  { value: 'critical', label: 'Critical Risk' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* KANBAN BOARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnDeals = filteredDeals.filter((d) => d.status === col.id);
            const totalColumnValue = columnDeals.reduce((sum, d) => sum + d.totalAmount, 0);

            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-3 min-w-[260px]"
              >
                {/* Column Header */}
                <div className={`border-t-2 ${col.color} pt-2 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-200">{col.title}</h3>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 text-[10px] font-bold text-slate-400">
                      {columnDeals.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {formatCurrency(totalColumnValue)}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3">
                  {columnDeals.length === 0 ? (
                    <div className="p-6 text-center rounded-lg border border-dashed border-white/5 bg-white/[0.01]">
                      <p className="text-[11px] text-slate-500">No deals in this stage</p>
                    </div>
                  ) : (
                    columnDeals.map((deal) => (
                      <GlassCard
                        key={deal.id}
                        hoverable
                        className="p-4 space-y-3 cursor-pointer group border-l-2 border-l-cyan-500/50"
                        onClick={() => router.push(`/quotations/${deal.id}`)}
                      >
                        {/* Header: Customer & Quote # */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                            {deal.customerName}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                            {deal.number}
                          </span>
                        </div>

                        {/* Amount & Discount */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-extrabold text-slate-100">
                            {formatCurrency(deal.totalAmount)}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {deal.discountPercentage}% disc
                          </span>
                        </div>

                        {/* Footer: Risk & Owner */}
                        <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs">
                          <RiskIndicator level={deal.riskLevel} variant="compact" />
                          <div className="flex items-center gap-1.5">
                            <Avatar name={deal.salesRep.name} size="xs" />
                            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                              {deal.salesRep.name.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
