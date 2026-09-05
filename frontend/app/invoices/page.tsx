'use client';

import * as React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Button,
  Badge,
} from '@/components/ui';
import { MOCK_INVOICES } from '@/data/mockInvoiceData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FileText, ArrowRight, DollarSign, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function InvoicesListPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');

  const filteredInvoices = React.useMemo(() => {
    return MOCK_INVOICES.filter((inv) => {
      const matchesSearch =
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesType = typeFilter === 'all' || inv.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'past_due':
        return <Badge variant="danger">Past Due</Badge>;
      case 'partially_paid':
        return <Badge variant="violet">Partially Paid</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <AppShell title="Invoices & Billing" subtitle="Accounts Receivable & Billing Management">
      <PageHeader
        title="Commercial Invoices"
        subtitle="Track issued invoices, payment collections & recurring subscription billing"
      />

      <div className="space-y-6">
        {/* KPI OVERVIEW CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Billed</span>
            <div className="text-lg font-extrabold text-slate-100">$849,020.00</div>
            <span className="text-[10px] text-slate-500">Cumulative invoice total</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Paid Collections</span>
            <div className="text-lg font-extrabold text-emerald-400">$650,000.00</div>
            <span className="text-[10px] text-slate-500">Settled payments</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Receivables</span>
            <div className="text-lg font-extrabold text-amber-400">$124,000.00</div>
            <span className="text-[10px] text-slate-500">Outstanding invoices</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Overdue AR</span>
            <div className="text-lg font-extrabold text-red-400">$75,020.00</div>
            <span className="text-[10px] text-slate-500">1 past due invoice</span>
          </GlassCard>
        </div>

        {/* SEARCH & FILTERS */}
        <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search invoice #, customer, quote..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'paid', label: 'Paid' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'past_due', label: 'Past Due' },
                  { value: 'draft', label: 'Draft' },
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'combined', label: 'Combined' },
                  { value: 'subscription_recurring', label: 'Subscription Recurring' },
                  { value: 'hardware_license', label: 'Hardware License' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* INVOICES TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Invoices Ledger ({filteredInvoices.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Quote Ref</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 font-mono">Due Date</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-100 block">{inv.customerName}</span>
                      <span className="text-[10px] text-slate-400">{inv.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{inv.quoteNumber}</td>
                    <td className="py-3.5 px-3 capitalize font-mono text-slate-400 text-[11px]">
                      {inv.type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-slate-100 font-mono">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-3 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <Link href={`/invoices/${inv.id}`}>
                        <Button variant="secondary" size="sm" className="gap-1 text-xs">
                          <span>View Invoice</span>
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
