'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Filter, Eye, CheckCircle2, Clock, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusBadge,
  RiskIndicator,
  Avatar,
  useToast,
} from '@/components/ui';
import { MOCK_APPROVAL_REQUESTS } from '@/data/mockApprovalData';
import { formatCurrency } from '@/lib/utils';

export default function ApprovalsListPage() {
  const router = useRouter();
  const toast = useToast();

  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [riskFilter, setRiskFilter] = React.useState('all');

  // Filtered list of approval requests
  const filteredRequests = React.useMemo(() => {
    return MOCK_APPROVAL_REQUESTS.filter((req) => {
      const matchesSearch =
        req.quoteNumber.toLowerCase().includes(search.toLowerCase()) ||
        req.customerName.toLowerCase().includes(search.toLowerCase()) ||
        req.salesRep.name.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === 'all' || req.requiredApprovalRole === roleFilter;
      const matchesRisk = riskFilter === 'all' || req.riskLevel === riskFilter;

      return matchesSearch && matchesRole && matchesRisk;
    });
  }, [search, roleFilter, riskFilter]);

  return (
    <AppShell title="Approvals" subtitle="Commercial Authorization & Margin Governance">
      <PageHeader
        title="Commercial Approval Queue"
        subtitle="Review, authorize, or return proposals exceeding sales representative discount limits"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.info('Queue Refresh', 'Synced latest pending approval requests')}>
            <Clock className="h-3.5 w-3.5" />
            <span>Refresh Queue</span>
          </Button>
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
                placeholder="Search quote #, customer, rep..."
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Required Roles' },
                  { value: 'Sales Manager', label: 'Sales Manager' },
                  { value: 'Finance Director', label: 'Finance Director' },
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

        {/* Approval Queue Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote #</TableHead>
              <TableHead>Customer Account</TableHead>
              <TableHead>Sales Rep</TableHead>
              <TableHead>Value / Discount</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Required Role</TableHead>
              <TableHead>Waiting Since</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((req) => (
              <TableRow key={req.id}>
                <TableCell>
                  <Link
                    href={`/approvals/${req.id}`}
                    className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {req.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{req.customerName}</span>
                    <span className="text-[10px] text-slate-500">{req.customerCompany}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar name={req.salesRep.name} size="xs" />
                    <span className="text-slate-300 text-xs">{req.salesRep.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-100">{formatCurrency(req.totalAmount)}</span>
                    <span className="text-[10px] font-semibold text-red-400">{req.discountPercentage}% Discount</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                        req.riskScore >= 75
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : req.riskScore >= 50
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {req.riskScore}/100
                    </span>
                    <RiskIndicator level={req.riskLevel} variant="compact" showLabel={false} />
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {req.requiredApprovalRole}
                  </span>
                </TableCell>
                <TableCell className="text-slate-400 text-xs">{req.waitingTime}</TableCell>
                <TableCell>
                  <StatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push(`/approvals/${req.id}`)}
                  >
                    <span>Review & Act</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
