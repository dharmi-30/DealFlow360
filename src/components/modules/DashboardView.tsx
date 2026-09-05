import React, { useState } from 'react';
import { Quotation, ApprovalRecord, FulfillmentRecord, SubscriptionRecord, DealHealthScore, ModuleType } from '../../types';
import { Badge } from '../common/Badge';
import {
  CheckSquare,
  ChevronRight,
  Plus,
  Activity,
  Clock,
  CheckCircle2,
  MessageSquare,
  Truck,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface DashboardViewProps {
  quotations: Quotation[];
  approvals: ApprovalRecord[];
  fulfillments: FulfillmentRecord[];
  subscriptions: SubscriptionRecord[];
  dealHealthScores: DealHealthScore[];
  setActiveModule: (module: ModuleType) => void;
  onSelectQuotation: (quotation: Quotation) => void;
  onOpenCreateModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  quotations,
  approvals,
  fulfillments,
  subscriptions,
  dealHealthScores,
  setActiveModule,
  onSelectQuotation,
  onOpenCreateModal,
}) => {
  const [activityFilter, setActivityFilter] = useState<'all' | 'approvals' | 'portal' | 'fulfillment'>('all');

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const openQuotations = quotations.filter((q) => q.status !== 'accepted' && q.status !== 'rejected');
  const atRiskDeals = dealHealthScores.filter((d) => d.riskLevel === 'High Risk' || d.riskLevel === 'Moderate Risk');

  const pipelineValue = openQuotations.reduce((sum, q) => sum + q.grandTotal, 0);

  // Generate activities dynamically from database quotations & approvals
  const activities = quotations.map((q, idx) => ({
    id: `act-${q.id}`,
    category: q.requiresApproval ? 'approvals' : q.status === 'customer_countered' ? 'portal' : 'fulfillment',
    title: `${q.customerName} quotation (${q.code})`,
    description: `Status: ${q.status.replace(/_/g, ' ').toUpperCase()} • Total: $${q.grandTotal.toLocaleString()} • Margin: ${q.marginPct}%`,
    timestamp: `${(idx + 1) * 15} minutes ago`,
    icon: q.requiresApproval ? AlertTriangle : q.status === 'customer_countered' ? MessageSquare : CheckCircle2,
    iconColor: q.requiresApproval ? '#f5b544' : q.status === 'customer_countered' ? '#38d9ff' : '#31d38a',
    badge: q.status.replace(/_/g, ' ').toUpperCase(),
    badgeVariant: q.requiresApproval ? 'warning' : 'success',
    module: 'quotations' as ModuleType,
  }));

  const filteredActivities = activityFilter === 'all'
    ? activities
    : activities.filter((a) => a.category === activityFilter);

  // Priority items dynamically created from schema.sql quotes requiring attention
  const priorityItems = quotations.slice(0, 3);

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* 1. Page Header */}
      <div className="page-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, letterSpacing: '0.05em' }}>
              Sales Operations Workspace
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span style={{ fontSize: '12px', color: '#9aa8ba', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> Seed Data Loaded from schema.sql
            </span>
          </div>
          <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
            Operational Command Center
          </h1>
          <p className="page-subheading" style={{ fontSize: '13px', color: '#9aa8ba', marginTop: '4px' }}>
            Immediate Action Required: <strong style={{ color: '#f5b544' }}>{pendingApprovals.length} approvals pending</strong> and <strong style={{ color: '#38d9ff' }}>{openQuotations.length} active proposals</strong> today.
          </p>
        </div>

        {/* Primary Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn-glass btn-glass-secondary"
            onClick={() => setActiveModule('approvals')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <CheckSquare size={15} style={{ color: '#f5b544' }} />
            <span>View Approvals</span>
            <span
              style={{
                background: 'rgba(245, 181, 68, 0.2)',
                color: '#f5b544',
                fontSize: '11px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '2px',
              }}
            >
              {pendingApprovals.length}
            </span>
          </button>

          <button
            className="btn-glass btn-glass-primary"
            onClick={onOpenCreateModal}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>New Quotation</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* KPI 1: Pending Approvals */}
        <div
          className="kpi-glass-card clickable"
          onClick={() => setActiveModule('approvals')}
          style={{ borderLeft: '3px solid #f5b544' }}
        >
          <div className="kpi-head" style={{ marginBottom: '12px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', fontWeight: 600, color: '#9aa8ba' }}>
              Pending Approvals
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(245, 181, 68, 0.12)',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#f5b544',
              }}
            >
              Sign-off Queue
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
            <div className="kpi-main-val font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#f5b544' }}>
              {pendingApprovals.length}
            </div>
            <span style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 500 }}>
              quotations waiting
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
              High-discount requests &gt;10% threshold
            </span>
            <ChevronRight size={14} style={{ color: '#f5b544' }} />
          </div>
        </div>

        {/* KPI 2: Open Quotations */}
        <div
          className="kpi-glass-card clickable"
          onClick={() => setActiveModule('quotations')}
          style={{ borderLeft: '3px solid #38d9ff' }}
        >
          <div className="kpi-head" style={{ marginBottom: '12px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', fontWeight: 600, color: '#9aa8ba' }}>
              Open Quotations
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(56, 217, 255, 0.12)',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#38d9ff',
              }}
            >
              Active Pipeline
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
            <div className="kpi-main-val font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#f5f7fa' }}>
              {openQuotations.length}
            </div>
            <span style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 500 }}>
              active quotations
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
              Pipeline Value: <strong style={{ color: '#38d9ff' }}>${pipelineValue.toLocaleString()}</strong>
            </span>
            <ChevronRight size={14} style={{ color: '#38d9ff' }} />
          </div>
        </div>

        {/* KPI 3: Active Subscriptions */}
        <div
          className="kpi-glass-card clickable"
          onClick={() => setActiveModule('subscriptions')}
          style={{ borderLeft: '3px solid #31d38a' }}
        >
          <div className="kpi-head" style={{ marginBottom: '12px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', fontWeight: 600, color: '#9aa8ba' }}>
              Active Subscriptions
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(49, 211, 138, 0.12)',
                padding: '3px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#31d38a',
              }}
            >
              Recurring Revenue
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
            <div className="kpi-main-val font-mono" style={{ fontSize: '28px', fontWeight: 800, color: '#31d38a' }}>
              {subscriptions.length}
            </div>
            <span style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 500 }}>
              active ARR accounts
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
              Managed in Subscriptions workspace
            </span>
            <ChevronRight size={14} style={{ color: '#31d38a' }} />
          </div>
        </div>
      </div>

      {/* 3. Operational Attention Triage */}
      <div
        className="glass-panel"
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(15, 28, 48, 0.75) 0%, rgba(20, 36, 62, 0.75) 100%)',
          border: '1px solid rgba(245, 181, 68, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(245, 181, 68, 0.15)', padding: '6px', borderRadius: '6px', color: '#f5b544' }}>
              <Zap size={16} />
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
              What Needs Your Attention Today
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: '#9aa8ba', fontWeight: 500 }}>
            {priorityItems.length} Priority Action Items
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, priorityItems.length)}, 1fr)`, gap: '12px' }}>
          {priorityItems.map((item) => (
            <div
              key={item.id}
              className="clickable"
              onClick={() => onSelectQuotation(item)}
              style={{
                padding: '12px 14px',
                background: 'rgba(7, 17, 31, 0.5)',
                borderRadius: '8px',
                border: '1px solid rgba(56, 217, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="font-mono" style={{ fontSize: '12px', fontWeight: 700, color: '#38d9ff' }}>
                    {item.code} • {item.customerName}
                  </span>
                  <Badge status={item.status} />
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
                  {item.approvalReason || `Quotation total: $${item.grandTotal.toLocaleString()} with ${item.marginPct}% margin.`}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '11px', color: '#9aa8ba' }}>Rep: {item.salesRep}</span>
                <span style={{ fontSize: '11px', color: '#38d9ff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  Inspect <ChevronRight size={11} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Recent Activity Feed + Deal Health Diagnostics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left Column: Activity Feed */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} style={{ color: '#38d9ff' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                Recent Activity
              </h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '6px' }}>
              {(['all', 'approvals', 'portal', 'fulfillment'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActivityFilter(filter)}
                  style={{
                    border: 'none',
                    background: activityFilter === filter ? 'rgba(56, 217, 255, 0.15)' : 'transparent',
                    color: activityFilter === filter ? '#38d9ff' : '#9aa8ba',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredActivities.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(56, 217, 255, 0.15)',
                      color: item.iconColor,
                      padding: '8px',
                      borderRadius: '6px',
                      marginTop: '2px',
                    }}
                  >
                    <IconComp size={16} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', fontWeight: 600, color: '#f5f7fa' }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.timestamp}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: '#9aa8ba', margin: 0, lineHeight: 1.45 }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deal Health Diagnostics */}
        <div className="glass-panel" style={{ marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} style={{ color: '#ff6b72' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Deal Health Diagnostics
                </h3>
              </div>
              <button
                className="btn-glass btn-glass-secondary btn-sm"
                onClick={() => setActiveModule('deal-health')}
                style={{ fontSize: '11px' }}
              >
                View All ({dealHealthScores.length})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dealHealthScores.map((score) => {
                const isHighRisk = score.riskLevel === 'High Risk';
                const isModRisk = score.riskLevel === 'Moderate Risk';

                return (
                  <div
                    key={score.id}
                    className="glass-card"
                    style={{
                      borderLeft: `3px solid ${isHighRisk ? '#ff6b72' : isModRisk ? '#f5b544' : '#31d38a'}`,
                      padding: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#f5f7fa' }}>{score.customerName}</strong>
                        <div className="font-mono" style={{ fontSize: '11px', color: '#2f8cff' }}>{score.quotationCode}</div>
                      </div>
                      <div className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: isHighRisk ? '#ff6b72' : isModRisk ? '#f5b544' : '#31d38a' }}>
                        {score.overallScore}/100
                      </div>
                    </div>

                    <div style={{ fontSize: '11px', color: '#9aa8ba', marginBottom: '8px' }}>
                      Primary Flag: <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{score.riskFactors[0] || 'Low margin or extended cycle'}</span>
                    </div>

                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${score.overallScore}%`,
                          background: isHighRisk ? '#ff6b72' : isModRisk ? '#f5b544' : '#31d38a',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="btn-glass btn-glass-secondary"
            onClick={() => setActiveModule('deal-health')}
            style={{ marginTop: '16px', width: '100%', justifyContent: 'center', fontSize: '12px' }}
          >
            Launch Deal Health Diagnostic Tool
          </button>
        </div>
      </div>

      {/* 5. Active Quotation Proposals Table */}
      <div className="glass-panel" style={{ marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
              Active Quotation Proposals
            </h3>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
              Showing real-time quotations requiring operational tracking
            </span>
          </div>

          <button
            className="btn-glass btn-glass-secondary btn-sm"
            onClick={() => setActiveModule('quotations')}
          >
            View Quotation Ledger ({quotations.length}) <ChevronRight size={13} />
          </button>
        </div>

        <div className="table-glass-wrapper">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Code</th>
                <th>Customer</th>
                <th>Sales Rep</th>
                <th className="number-cell">Grand Total</th>
                <th className="number-cell">Margin %</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id} className="clickable" onClick={() => onSelectQuotation(q)}>
                  <td className="font-mono" style={{ fontWeight: 700, color: '#2f8cff' }}>
                    {q.code}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f5f7fa' }}>{q.customerName}</div>
                  </td>
                  <td style={{ fontSize: '12px', color: '#9aa8ba' }}>
                    {q.salesRep}
                  </td>
                  <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#f5f7fa' }}>
                    ${q.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="number-cell font-mono"
                    style={{ color: q.marginPct < 20 ? '#ff6b72' : '#31d38a', fontWeight: 600 }}
                  >
                    {q.marginPct.toFixed(1)}%
                  </td>
                  <td>
                    <Badge status={q.status} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-glass btn-glass-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuotation(q);
                      }}
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      Inspect <ChevronRight size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
