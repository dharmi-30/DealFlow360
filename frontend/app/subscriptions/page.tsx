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
import { MOCK_SUBSCRIPTIONS } from '@/data/mockSubscriptionData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { RefreshCw, Calendar, ArrowRight, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function SubscriptionsListPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [cycleFilter, setCycleFilter] = React.useState('all');

  const filteredSubscriptions = React.useMemo(() => {
    return MOCK_SUBSCRIPTIONS.filter((sub) => {
      const matchesSearch =
        sub.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.planName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
      const matchesCycle = cycleFilter === 'all' || sub.billingCycle === cycleFilter;
      return matchesSearch && matchesStatus && matchesCycle;
    });
  }, [searchQuery, statusFilter, cycleFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trialing':
        return <Badge variant="violet">Trialing</Badge>;
      case 'past_due':
        return <Badge variant="danger">Past Due</Badge>;
      case 'pending_cancellation':
        return <Badge variant="warning">Pending Cancel</Badge>;
      case 'canceled':
        return <Badge variant="outline">Canceled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <AppShell title="Subscriptions" subtitle="Recurring Revenue & Contract Management">
      <PageHeader
        title="Subscription Contracts"
        subtitle="Manage B2B SaaS, SLA services & recurring billing agreements"
      />

      <div className="space-y-6">
        {/* TOP SUMMARY METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Active Subscriptions</span>
            <div className="text-lg font-extrabold text-slate-100">{MOCK_SUBSCRIPTIONS.length}</div>
            <span className="text-[10px] text-slate-500">Live recurring contracts</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Annual Recurring Revenue (ARR)</span>
            <div className="text-lg font-extrabold text-cyan-400">$260,450.00</div>
            <span className="text-[10px] text-slate-500">Run-rate ARR</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Upcoming Renewals (30 Days)</span>
            <div className="text-lg font-extrabold text-amber-400">2 Contracts</div>
            <span className="text-[10px] text-slate-500">Next cycle dispatch</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Past Due Accounts</span>
            <div className="text-lg font-extrabold text-red-400">1 Account</div>
            <span className="text-[10px] text-slate-500">Requires collection follow-up</span>
          </GlassCard>
        </div>

        {/* SEARCH & FILTERS */}
        <GlassCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subscription ID, customer, plan..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'trialing', label: 'Trialing' },
                  { value: 'past_due', label: 'Past Due' },
                  { value: 'pending_cancellation', label: 'Pending Cancellation' },
                ]}
              />
            </div>

            <div className="w-40">
              <Select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Cycles' },
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'yearly', label: 'Yearly' },
                ]}
              />
            </div>
          </div>
        </GlassCard>

        {/* SUBSCRIPTIONS TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-violet-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Subscriptions Directory ({filteredSubscriptions.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Subscription ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Plan Name</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">Next Billing Date</th>
                  <th className="py-2.5 px-3 text-center">Cycle</th>
                  <th className="py-2.5 px-3 text-center">Qty / Seats</th>
                  <th className="py-2.5 px-3 text-right">Recurring Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-3 font-mono font-bold text-cyan-400">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-100 block">{sub.customerName}</span>
                      <span className="text-[10px] text-slate-400">{sub.customerEmail}</span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-200">{sub.planName}</td>
                    <td className="py-3.5 px-3 text-center">{getStatusBadge(sub.status)}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-400">{formatDate(sub.startDate)}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-200 font-semibold">
                      {formatDate(sub.nextBillingDate)}
                    </td>
                    <td className="py-3.5 px-3 text-center capitalize font-mono text-slate-400">
                      {sub.billingCycle}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-200">{sub.quantity}</td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-cyan-400 font-mono">
                      {formatCurrency(sub.recurringAmount)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link href={`/subscriptions/${sub.id}`}>
                        <Button variant="secondary" size="sm" className="gap-1 text-xs">
                          <span>Details</span>
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
