'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Percent,
  Truck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Eye,
  Zap,
  Sliders,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Button,
  Badge,
  Modal,
  Textarea,
  Select,
  useToast,
  ProgressBar,
} from '@/components/ui';
import {
  MOCK_DEAL_HEALTH_ALERTS,
  MOCK_DEAL_HEALTH_OVERVIEW,
} from '@/data/mockDealHealthData';
import type { DealHealthAlert, AlertSeverity, AlertType } from '@/types/dealHealth';
import { formatCurrency } from '@/lib/utils';

export default function DealHealthPage() {
  const router = useRouter();
  const toast = useToast();

  // Local state for active alerts
  const [alerts, setAlerts] = React.useState<DealHealthAlert[]>(MOCK_DEAL_HEALTH_ALERTS);
  const [activeFilter, setActiveFilter] = React.useState<string>('all');
  const [severityFilter, setSeverityFilter] = React.useState<string>('all');

  // Action modal state
  const [selectedAlert, setSelectedAlert] = React.useState<DealHealthAlert | null>(null);
  const [actionType, setActionType] = React.useState<string>('escalate');
  const [actionNote, setActionNote] = React.useState('');

  // Filter alerts
  const filteredAlerts = React.useMemo(() => {
    return alerts.filter((alt) => {
      const matchesType = activeFilter === 'all' || alt.type === activeFilter;
      const matchesSeverity = severityFilter === 'all' || alt.severity === severityFilter;
      return matchesType && matchesSeverity;
    });
  }, [alerts, activeFilter, severityFilter]);

  // Execute Action from Modal
  const handleExecuteAction = () => {
    if (!selectedAlert) return;

    // Remove or resolve alert from active feed
    setAlerts((prev) => prev.filter((a) => a.id !== selectedAlert.id));
    setSelectedAlert(null);
    setActionNote('');

    toast.success(
      'Action Executed',
      `Resolution action '${actionType.replace('_', ' ')}' logged for ${selectedAlert.quoteNumber}.`
    );
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <AlertTriangle className="h-3 w-3" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            LOW
          </span>
        );
      default:
        return <Badge variant="default">{severity}</Badge>;
    }
  };

  const getTypeIcon = (type: AlertType) => {
    switch (type) {
      case 'stalled_deal':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'discount_anomaly':
        return <Percent className="h-4 w-4 text-red-400" />;
      case 'delivery_promise_risk':
        return <Truck className="h-4 w-4 text-purple-400" />;
    }
  };

  return (
    <AppShell title="Deal Health" subtitle="Identify stalled, risky and abnormal deals before they slip.">
      <PageHeader
        title="Deal Health"
        subtitle="Identify stalled, risky and abnormal deals before they slip."
      />

      <div className="space-y-6">
        {/* TOP KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-4 space-y-1 border-l-4 border-l-emerald-500">
            <span className="text-[10px] uppercase font-bold text-slate-400">Healthy Deals</span>
            <div className="text-xl font-extrabold text-emerald-400">
              {MOCK_DEAL_HEALTH_OVERVIEW.healthyDealsCount}
            </div>
            <span className="text-[10px] text-slate-500">Normal progression rate</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1 border-l-4 border-l-red-500">
            <span className="text-[10px] uppercase font-bold text-slate-400">At Risk</span>
            <div className="text-xl font-extrabold text-red-400">
              {MOCK_DEAL_HEALTH_OVERVIEW.atRiskCount}
            </div>
            <span className="text-[10px] text-slate-500">Requires manager intervention</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1 border-l-4 border-l-amber-500">
            <span className="text-[10px] uppercase font-bold text-slate-400">Stalled</span>
            <div className="text-xl font-extrabold text-amber-400">
              {MOCK_DEAL_HEALTH_OVERVIEW.stalledCount}
            </div>
            <span className="text-[10px] text-slate-500">&gt; 5 days inactive</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1 border-l-4 border-l-purple-500">
            <span className="text-[10px] uppercase font-bold text-slate-400">Discount Anomalies</span>
            <div className="text-xl font-extrabold text-purple-400">
              {MOCK_DEAL_HEALTH_OVERVIEW.discountAnomaliesCount}
            </div>
            <span className="text-[10px] text-slate-500">Above historical baselines</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1 border-l-4 border-l-cyan-500">
            <span className="text-[10px] uppercase font-bold text-slate-400">Delivery Risk</span>
            <div className="text-xl font-extrabold text-cyan-400">
              {MOCK_DEAL_HEALTH_OVERVIEW.deliveryRiskCount}
            </div>
            <span className="text-[10px] text-slate-500">Inventory backordered</span>
          </GlassCard>
        </div>

        {/* DEAL HEALTH SCORE & CONTRIBUTING FACTORS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 0-100 SCORE CARD & FACTORS (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-5 space-y-5 border-l-4 border-l-cyan-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    Portfolio Deal Health Score
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time telemetry index calculated across deal cycles
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-cyan-400 font-mono">
                    {MOCK_DEAL_HEALTH_OVERVIEW.overallScore}
                    <span className="text-sm text-slate-500 font-normal">/100</span>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    MODERATE HEALTH
                  </span>
                </div>
              </div>

              {/* CONTRIBUTING FACTORS */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Contributing Factors & Risk Sub-Scores
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOCK_DEAL_HEALTH_OVERVIEW.contributingFactors.map((factor) => (
                    <div
                      key={factor.key}
                      className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{factor.name}</span>
                        <span
                          className={`font-mono font-bold ${
                            factor.score >= 80
                              ? 'text-emerald-400'
                              : factor.score >= 65
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {factor.score}/100
                        </span>
                      </div>

                      <ProgressBar
                        value={factor.score}
                        max={100}
                        size="sm"
                        variant={
                          factor.score >= 80
                            ? 'emerald'
                            : factor.score >= 65
                            ? 'amber'
                            : 'danger'
                        }
                      />

                      <span className="text-[10px] text-slate-400 block truncate">
                        {factor.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* HISTORICAL TREND CHART (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Health Index Trend (4 Weeks)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Weekly Index</span>
              </div>

              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_DEAL_HEALTH_OVERVIEW.historicalTrend}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis domain={[50, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#090e1a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      name="Health Score"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#scoreGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* MAIN SECTION: "ATTENTION REQUIRED" FEED */}
        <GlassCard className="p-5 space-y-5">
          {/* FEED HEADER & FILTERS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Attention Required Feed ({filteredAlerts.length})
                </h3>
                <p className="text-[10px] text-slate-400">
                  Prioritized anomaly feed requiring manager intervention
                </p>
              </div>
            </div>

            {/* FILTER CONTROLS */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                {[
                  { id: 'all', label: 'All Alerts' },
                  { id: 'stalled_deal', label: 'Stalled Deals' },
                  { id: 'discount_anomaly', label: 'Discount Anomalies' },
                  { id: 'delivery_promise_risk', label: 'Delivery Risk' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      activeFilter === tab.id
                        ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="w-36">
                <Select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Severities' },
                    { value: 'critical', label: 'Critical' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* ALERTS FEED CARDS */}
          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto opacity-80" />
              <h4 className="text-xs font-semibold text-slate-300">No active health alerts</h4>
              <p className="text-[11px] text-slate-500">
                All deal health anomalies for this filter criteria have been resolved.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alt) => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border transition-all space-y-3 ${
                    alt.severity === 'critical'
                      ? 'bg-red-500/[0.03] border-red-500/30 hover:border-red-500/50'
                      : alt.severity === 'high'
                      ? 'bg-orange-500/[0.03] border-orange-500/30 hover:border-orange-500/50'
                      : 'bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* TOP ROW: SEVERITY, TYPE & DETECTED TIME */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(alt.severity)}
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        {getTypeIcon(alt.type)}
                        <span>{alt.typeLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-extrabold text-cyan-400 font-mono">{formatCurrency(alt.dealValue)}</span>
                      <span className="text-[10px] font-mono text-slate-500">{alt.detectedTime}</span>
                    </div>
                  </div>

                  {/* QUOTE & CUSTOMER METADATA */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Quote Reference</span>
                      <span className="font-mono font-bold text-slate-100">{alt.quoteNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Customer</span>
                      <span className="font-bold text-slate-200">{alt.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Assigned Sales Rep</span>
                      <span className="font-semibold text-slate-300">{alt.salesRep}</span>
                    </div>
                  </div>

                  {/* DESCRIPTION & RECOMMENDED ACTION */}
                  <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/5 text-xs">
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {alt.description}
                    </p>

                    <div className="pt-2 border-t border-white/5 flex items-start gap-1.5 text-cyan-300">
                      <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">
                        <strong>Recommended Action:</strong> {alt.recommendedAction}
                      </span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/quotations/${alt.quoteId}`)}
                      className="text-xs gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Deal</span>
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedAlert(alt);
                        setActionType('escalate');
                        setActionNote('');
                      }}
                      className="text-xs gap-1.5 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
                    >
                      <Zap className="h-3.5 w-3.5" />
                      <span>Take Action</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* MOCK ACTION DRAWER / MODAL */}
      <Modal
        isOpen={!!selectedAlert}
        onClose={() => setSelectedAlert(null)}
        title={`Take Action — ${selectedAlert?.quoteNumber}`}
        description="Execute operational playbook actions, escalations, or policy overrides."
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setSelectedAlert(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleExecuteAction}>
              Execute Resolution Action
            </Button>
          </div>
        }
      >
        {selectedAlert && (
          <div className="space-y-4 text-xs text-slate-300">
            {/* ALERT SUMMARY */}
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-100">{selectedAlert.customerName}</span>
                {getSeverityBadge(selectedAlert.severity)}
              </div>
              <p className="text-[11px] text-slate-400">{selectedAlert.description}</p>
            </div>

            {/* ACTION SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-200 block">Select Action Playbook</label>
              <Select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                options={[
                  { value: 'escalate', label: 'Escalate to Sales Director' },
                  { value: 'trim_discount', label: 'Require Discount Trim / Policy Compliance' },
                  { value: 'client_call', label: 'Schedule Urgent Client Alignment Call' },
                  { value: 'dismiss', label: 'Dismiss Alert (Log Manager Exception)' },
                ]}
              />
            </div>

            {/* ACTION NOTE */}
            <Textarea
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              label="Manager Action Notes & Instructions"
              placeholder="e.g., Authorized temporary exception for Q4 strategic account commitment..."
              rows={3}
            />
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
