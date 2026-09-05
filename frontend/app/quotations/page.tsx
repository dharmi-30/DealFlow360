'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Filter, ArrowUpDown, Eye, FileText, Download, MoreVertical } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Button,
  IconButton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusBadge,
  RiskIndicator,
  Dropdown,
  Avatar,
} from '@/components/ui';
import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { QuotationStatus, RiskLevel } from '@/types';

export default function QuotationsPage() {
  const router = useRouter();

  const [search, setSearch] = React.useState('');
  const [customerFilter, setCustomerFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [salesRepFilter, setSalesRepFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('newest');

  // Filtered & sorted quotations list
  const filteredQuotations = React.useMemo(() => {
    return MOCK_QUOTATIONS.filter((q) => {
      // Search
      const matchesSearch =
        q.number.toLowerCase().includes(search.toLowerCase()) ||
        q.customerName.toLowerCase().includes(search.toLowerCase()) ||
        q.salesRep.name.toLowerCase().includes(search.toLowerCase());

      // Customer
      const matchesCustomer = customerFilter === 'all' || q.customerName === customerFilter;

      // Status
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

      // Sales Rep
      const matchesSalesRep = salesRepFilter === 'all' || q.salesRep.name === salesRepFilter;

      return matchesSearch && matchesCustomer && matchesStatus && matchesSalesRep;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
      if (sortBy === 'amount_asc') return a.totalAmount - b.totalAmount;
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [search, customerFilter, statusFilter, salesRepFilter, sortBy]);

  // Unique filter lists
  const uniqueCustomers = Array.from(new Set(MOCK_QUOTATIONS.map((q) => q.customerName)));
  const uniqueSalesReps = Array.from(new Set(MOCK_QUOTATIONS.map((q) => q.salesRep.name)));

  return (
    <AppShell title="Quotations" subtitle="Commercial Proposal Workspace">
      <PageHeader
        title="Quotation Management"
        subtitle="Manage B2B sales proposals, commercial margins, and multi-stage discount approvals"
        actions={
          <Button variant="primary" size="sm" onClick={() => router.push('/quotation-builder')}>
            <Plus className="h-4 w-4" />
            <span>Create Quotation</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Top Controls Bar */}
        <GlassCard className="p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search quote #, customer..."
              />
            </div>

            {/* Customer Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Customers' },
                  ...uniqueCustomers.map((cust) => ({ value: cust, label: cust })),
                ]}
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'draft', label: 'Draft' },
                  { value: 'pending_approval', label: 'Pending Approval' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'negotiation', label: 'Negotiation' },
                  { value: 'accepted', label: 'Confirmed / Accepted' },
                ]}
              />
            </div>

            {/* Sales Rep Filter */}
            <div className="w-full sm:w-40">
              <Select
                value={salesRepFilter}
                onChange={(e) => setSalesRepFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Reps' },
                  ...uniqueSalesReps.map((rep) => ({ value: rep, label: rep })),
                ]}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="w-full lg:w-48">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
                { value: 'amount_desc', label: 'Sort: Amount High-Low' },
                { value: 'amount_asc', label: 'Sort: Amount Low-High' },
              ]}
            />
          </div>
        </GlassCard>

        {/* Quotation Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer Account</TableHead>
              <TableHead>Sales Rep</TableHead>
              <TableHead>Amount ($)</TableHead>
              <TableHead>Margin %</TableHead>
              <TableHead>Discount %</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotations.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <Link
                    href={`/quotations/${q.id}`}
                    className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {q.number}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{q.customerName}</span>
                    <span className="text-[10px] text-slate-500">{q.customerEmail}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={q.salesRep.name} size="xs" />
                    <span className="text-slate-300 text-xs">{q.salesRep.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-100">
                  {formatCurrency(q.totalAmount)}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${
                      q.marginPercentage < 20 ? 'text-red-400 font-bold' : 'text-emerald-400'
                    }`}
                  >
                    {q.marginPercentage}%
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      q.discountPercentage > 20
                        ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                        : 'bg-white/5 text-slate-300'
                    }`}
                  >
                    {q.discountPercentage}%
                  </span>
                </TableCell>
                <TableCell>
                  <RiskIndicator level={q.riskLevel} variant="compact" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={q.status} />
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {formatDate(q.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Dropdown
                    trigger={
                      <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Actions"
                        icon={<MoreVertical className="h-4 w-4" />}
                      />
                    }
                    items={[
                      {
                        id: 'view',
                        label: 'View Details',
                        icon: Eye,
                        onClick: () => router.push(`/quotations/${q.id}`),
                      },
                      {
                        id: 'duplicate',
                        label: 'Duplicate Proposal',
                        icon: FileText,
                      },
                      {
                        id: 'pdf',
                        label: 'Download PDF',
                        icon: Download,
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
