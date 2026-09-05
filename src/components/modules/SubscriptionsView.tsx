import React, { useState } from 'react';
import { SubscriptionRecord } from '../../types';
import { Badge } from '../common/Badge';
import {
  CheckCircle2,
  PauseCircle,
  XCircle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SubscriptionsViewProps {
  subscriptions: SubscriptionRecord[];
  onGenerateExpansionQuote?: (sub: SubscriptionRecord) => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  subscriptions,
  onGenerateExpansionQuote,
}) => {
  const [selectedSubId, setSelectedSubId] = useState<string>(subscriptions[0]?.id || 'sub-1');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0];

  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const renewalCount = subscriptions.filter((s) => s.status === 'pending_renewal').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'canceled').length;

  const handleModify = () => {
    if (!selectedSub) return;
    setActionNotice(`Subscription ${selectedSub.code} modified: Schedule & Line amounts recalculated.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Subscriptions & Recurring Billing</h1>
          <p className="page-subheading">
            Commercial contract management, recurring revenue lines, and automated billing schedule (schema.sql).
          </p>
        </div>

        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#38d9ff',
            backgroundColor: 'rgba(56,217,255,0.08)',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(56,217,255,0.2)',
          }}
        >
          Active Subscriptions: <strong className="font-mono">{subscriptions.length} Contracts</strong>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            background: 'rgba(49,211,138,0.12)',
            border: '1px solid rgba(49,211,138,0.3)',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            color: '#31d38a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP SUMMARY */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Active Subscriptions</span>
            <CheckCircle2 size={16} style={{ color: '#31d38a' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#31d38a' }}>
            {activeCount} Active
          </div>
          <div className="kpi-sub-label">Recurring MRR accounts in good standing</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Pending Renewal</span>
            <PauseCircle size={16} style={{ color: '#f5b544' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#f5b544' }}>
            {renewalCount} Pending Renewal
          </div>
          <div className="kpi-sub-label">Renewal window open in next 30/60 days</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Cancelled Contracts</span>
            <XCircle size={16} style={{ color: '#ff6b72' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#ff6b72' }}>
            {cancelledCount} Cancelled
          </div>
          <div className="kpi-sub-label">Terminated or non-renewed accounts</div>
        </div>
      </div>

      {/* SUBSCRIPTIONS TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
            Subscriptions Queue (Parsed from schema.sql)
          </h3>
          <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
            Click row to inspect contract line detail
          </span>
        </div>

        <div className="table-glass-wrapper">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Plan Name</th>
                <th>Billing Cycle</th>
                <th className="number-cell">MRR</th>
                <th className="number-cell">ARR</th>
                <th>Renewal Date</th>
                <th>Status</th>
                <th className="number-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const isSelected = sub.id === selectedSub?.id;
                return (
                  <tr
                    key={sub.id}
                    className={`clickable ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => setSelectedSubId(sub.id)}
                    style={{
                      background: isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#f5f7fa' }}>{sub.customerName}</div>
                      <div className="font-mono" style={{ fontSize: '11px', color: '#9aa8ba' }}>
                        {sub.code}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#2f8cff' }}>{sub.planName}</div>
                    </td>
                    <td>
                      <span className="badge-glass badge-glass-neutral">{sub.billingCycle}</span>
                    </td>
                    <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#31d38a' }}>
                      ${sub.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#38d9ff' }}>
                      ${sub.arr.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="font-mono" style={{ color: '#38d9ff' }}>
                      {sub.renewalDate}
                    </td>
                    <td>
                      <Badge status={sub.status} />
                    </td>
                    <td className="number-cell">
                      <button
                        className="btn-glass btn-glass-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubId(sub.id);
                        }}
                      >
                        Inspect <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUBSCRIPTION DETAIL INSPECTOR */}
      {selectedSub && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
                  {selectedSub.customerName}
                </h3>
                <span className="font-mono" style={{ fontSize: '13px', color: '#38d9ff' }}>
                  ({selectedSub.code})
                </span>
                <Badge status={selectedSub.status} />
              </div>
              <div style={{ fontSize: '13px', color: '#9aa8ba', marginTop: '2px' }}>
                Plan: <strong style={{ color: '#f5f7fa' }}>{selectedSub.planName}</strong> • Seats: {selectedSub.seats}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '11px', color: '#9aa8ba', textTransform: 'uppercase', fontWeight: 700 }}>MRR</div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#31d38a' }}>
                  ${selectedSub.mrr.toLocaleString('en-US', { minimumFractionDigits: 2 })} / mo
                </div>
              </div>

              <div style={{ textAlign: 'right', padding: '6px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '11px', color: '#9aa8ba', textTransform: 'uppercase', fontWeight: 700 }}>ARR</div>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#38d9ff' }}>
                  ${selectedSub.arr.toLocaleString('en-US', { minimumFractionDigits: 2 })} / yr
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn-glass btn-glass-secondary" onClick={handleModify}>
              Modify Subscription
            </button>
            {onGenerateExpansionQuote && (
              <button className="btn-glass btn-glass-primary" onClick={() => onGenerateExpansionQuote(selectedSub)}>
                + 1-Click Expansion Draft
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
