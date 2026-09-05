'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  GitBranch,
  FileText,
  Clock,
  DollarSign,
  Percent,
  ShieldAlert,
  ArrowRight,
  AlertTriangle,
  Truck,
  Plus,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  SectionHeader,
  GlassCard,
  MetricCard,
  RiskIndicator,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  ProgressBar,
  Modal,
  useToast,
} from '@/components/ui';
import { MOCK_DASHBOARD_DATA } from '@/data/mockDashboardData';
import { formatCurrency } from '@/lib/utils';
import type { TimePeriod, ApprovalAttentionItem } from '@/types/dashboard';

const ICON_MAP: Record<string, React.ElementType> = {
  GitBranch,
  FileText,
  Clock,
  DollarSign,
  Percent,
  ShieldAlert,
};

export default function DashboardPage() {
  const [period, setPeriod] = React.useState<TimePeriod>('this_month');
  const [selectedApproval, setSelectedApproval] = React.useState<ApprovalAttentionItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const toast = useToast();

  const currentChartData = MOCK_DASHBOARD_DATA.chartData[period];

  const handleApproveAction = (item: ApprovalAttentionItem) => {
    setSelectedApproval(item);
    setIsApproveModalOpen(true);
  };

  const confirmApproval = () => {
    if (!selectedApproval) return;
    toast.success('Quotation Approved', `${selectedApproval.quoteNumber} for ${selectedApproval.customerName} approved`);
    setIsApproveModalOpen(false);
    setSelectedApproval(null);
  };

  // Select top 4 core KPIs for clean 4-card top row
  const topKpis = MOCK_DASHBOARD_DATA.kpis.slice(0, 4);

  return (
    <AppShell title="Sales Command Center">
      {/* Streamlined Top Controls & Header */}
      <PageHeader
        title="Sales Command Center"
        subtitle="Commercial pipeline velocity, approval attention queue, and deal health safeguards"
        actions={
          <div className="flex items-center gap-3">
            {/* Period Selector Pills */}
            <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
              {(
                [
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'this_quarter', label: 'This Quarter' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPeriod(id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all select-none ${
                    period === id
                      ? 'bg-cyan-500/15 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Link href="/quotations/new">
              <Button variant="primary" size="md">
                <Plus className="h-4 w-4" />
                <span>New Quotation</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* 4 CORE KPI CARDS (Clean 4-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topKpis.map((kpi) => {
            const IconComponent = ICON_MAP[kpi.iconName] || DollarSign;
            return (
              <MetricCard
                key={kpi.id}
                title={kpi.label}
                value={kpi.value}
                isCurrency={kpi.isCurrency}
                change={kpi.change}
                changeLabel={kpi.changeLabel}
                trend={kpi.trend}
                icon={IconComponent}
                accentColor={kpi.accentColor}
              />
            );
          })}
        </div>

        {/* SECTION 1: REVENUE CHART & PIPELINE STAGES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Panel */}
          <GlassCard className="lg:col-span-2 p-5 flex flex-col justify-between">
            <SectionHeader
              title="Revenue & Quotation Velocity"
              description="Real-time commercial revenue versus quote volume target"
              action={
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    <span className="text-slate-300">Revenue ($)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                    <span className="text-slate-300">Quotations ($)</span>
                  </div>
                </div>
              }
            />

            <div className="mt-4 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0c1322',
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), 'Value']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#cyanGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="quotations"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#violetGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Pipeline Summary Panel */}
          <GlassCard className="p-5 flex flex-col justify-between space-y-4">
            <SectionHeader
              title="Pipeline Stages"
              description="Active volume by deal status"
              action={
                <Link href="/pipeline" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  View Kanban →
                </Link>
              }
            />

            <div className="space-y-3.5">
              {MOCK_DASHBOARD_DATA.pipelineStages.map((stage) => {
                const totalValueSum = MOCK_DASHBOARD_DATA.pipelineStages.reduce((acc, s) => acc + s.value, 0);
                const percent = (stage.value / totalValueSum) * 100;

                return (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{stage.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-[11px] font-medium">{stage.count} deals</span>
                        <span className="font-bold text-slate-100">{formatCurrency(stage.value)}</span>
                      </div>
                    </div>
                    <ProgressBar
                      value={percent}
                      size="sm"
                      variant={stage.stage === 'accepted' ? 'cyan' : stage.stage === 'approved' ? 'emerald' : 'violet'}
                    />
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">Total Pipeline:</span>
              <span className="font-bold text-sm text-slate-100">
                {formatCurrency(MOCK_DASHBOARD_DATA.pipelineStages.reduce((acc, s) => acc + s.value, 0))}
              </span>
            </div>
          </GlassCard>
        </div>

        {/* SECTION 2: APPROVAL QUEUE & SAFEGUARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Approval Attention Queue (2 Cols) */}
          <div className="lg:col-span-2 space-y-3">
            <SectionHeader
              title="Approval Attention Queue"
              description="Quotations requiring commercial discount authorization"
              action={
                <Link href="/approvals" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  View All Pending ({MOCK_DASHBOARD_DATA.approvalQueue.length}) →
                </Link>
              }
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer / Account</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DASHBOARD_DATA.approvalQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-bold text-cyan-400">{item.quoteNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200">{item.customerName}</span>
                        <span className="text-[11px] text-slate-400 font-normal">Req: {item.requestedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-100">{formatCurrency(item.totalValue)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          item.discountPercentage > 20
                            ? 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                        }`}
                      >
                        {item.discountPercentage}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <RiskIndicator level={item.riskLevel} variant="badge" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleApproveAction(item)}
                        className="hover:border-cyan-500/50 hover:text-cyan-400 transition-colors"
                      >
                        Review & Approve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Deal Health Safeguards (1 Col) */}
          <div className="space-y-3">
            <SectionHeader
              title="Deal Health Safeguards"
              description="Active risks & policy anomalies"
              action={
                <Link href="/deal-health" className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Inspector →
                </Link>
              }
            />

            <div className="space-y-3">
              {/* Stalled Deals */}
              <GlassCard hoverable className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Stalled Deals</h4>
                    <p className="text-[11px] text-slate-400">&gt;14 days inactive</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-100">{MOCK_DASHBOARD_DATA.healthSummary.stalledDealsCount} Deals</span>
                  <p className="text-[11px] text-slate-400 font-mono">{formatCurrency(MOCK_DASHBOARD_DATA.healthSummary.stalledDealsValue)}</p>
                </div>
              </GlassCard>

              {/* Discount Anomalies */}
              <GlassCard hoverable className="p-4 flex items-center justify-between border-l-4 border-l-red-500">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Discount Anomalies</h4>
                    <p className="text-[11px] text-slate-400">Margin erosion met</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-100">{MOCK_DASHBOARD_DATA.healthSummary.discountAnomaliesCount} Deals</span>
                  <p className="text-[11px] text-slate-400 font-mono">{formatCurrency(MOCK_DASHBOARD_DATA.healthSummary.discountAnomaliesValue)}</p>
                </div>
              </GlassCard>

              {/* Delivery Risk */}
              <GlassCard hoverable className="p-4 flex items-center justify-between border-l-4 border-l-orange-500">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Delivery Risk</h4>
                    <p className="text-[11px] text-slate-400">Stock delay alert</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-100">{MOCK_DASHBOARD_DATA.healthSummary.deliveryRiskCount} Order</span>
                  <p className="text-[11px] text-slate-400 font-mono">{formatCurrency(MOCK_DASHBOARD_DATA.healthSummary.deliveryRiskValue)}</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Confirmation Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Approve Quotation ${selectedApproval?.quoteNumber}`}
        description={`Commercial discount authorization for ${selectedApproval?.customerName}`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsApproveModalOpen(false)}>
              Reject / Request Changes
            </Button>
            <Button variant="primary" size="sm" onClick={confirmApproval}>
              Authorize Quotation
            </Button>
          </>
        }
      >
        {selectedApproval && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-white/5 p-4 border border-white/10">
              <div>
                <span className="text-slate-400">Total Quote Value:</span>
                <p className="text-base font-bold text-slate-100">{formatCurrency(selectedApproval.totalValue)}</p>
              </div>
              <div>
                <span className="text-slate-400">Requested Discount:</span>
                <p className="text-base font-bold text-red-400">{selectedApproval.discountPercentage}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Risk Assessment:</span>
              <RiskIndicator level={selectedApproval.riskLevel} variant="badge" />
            </div>

            <p className="text-slate-400 leading-relaxed">
              Authorizing this proposal will generate customer-facing negotiation links and dispatch notification to warehouse fulfillment channels.
            </p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
