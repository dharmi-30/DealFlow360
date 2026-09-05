import React, { useState } from 'react';
import { DealHealthScore } from '../../types';
import {
  Clock,
  AlertTriangle,
  ShieldAlert,
  AlertCircle,
  Send,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Shield,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';

interface DealHealthViewProps {
  dealHealthScores?: DealHealthScore[];
  onOpenQuotation?: (quotationCode: string) => void;
}

interface DealAlert {
  id: string;
  quotationCode: string;
  customerName: string;
  issue: string;
  flaggedDate: string;
  healthScore: number;
  status: 'Nudge sent' | 'Escalated to Manager' | 'Pending Action';
  reasons: string[];
  recommendedAction: string;
}

const SAMPLE_ALERTS: DealAlert[] = [
  {
    id: 'alert-1',
    quotationCode: 'Q-1030',
    customerName: 'Zenith Co',
    issue: 'Idle 9 days',
    flaggedDate: 'Aug 24',
    healthScore: 38,
    status: 'Nudge sent',
    reasons: ['quotation inactive', 'unusual discount', 'delivery risk'],
    recommendedAction: 'Escalate to Sales Manager',
  },
  {
    id: 'alert-2',
    quotationCode: 'Q-1025',
    customerName: 'Delta LLC',
    issue: 'Discount 22% vs 8%',
    flaggedDate: 'Aug 25',
    healthScore: 42,
    status: 'Escalated to Manager',
    reasons: ['unusual discount', 'margin guardrail breach'],
    recommendedAction: 'Escalate to Sales Manager',
  },
  {
    id: 'alert-3',
    quotationCode: 'Q-1042',
    customerName: 'Acme Corp',
    issue: 'Delivery lead time constraint',
    flaggedDate: 'Aug 26',
    healthScore: 55,
    status: 'Pending Action',
    reasons: ['delivery risk', 'multi-warehouse split required'],
    recommendedAction: 'Request Inventory Consolidation',
  },
  {
    id: 'alert-4',
    quotationCode: 'Q-1039',
    customerName: 'Beta Industries',
    issue: 'Idle 8 days post-counter',
    flaggedDate: 'Aug 27',
    healthScore: 48,
    status: 'Pending Action',
    reasons: ['quotation inactive', 'unresolved buyer counter-offer'],
    recommendedAction: 'Nudge Sales Rep',
  },
];

export const DealHealthView: React.FC<DealHealthViewProps> = ({ dealHealthScores = [], onOpenQuotation }) => {
  // Map parsed dealHealthScores from schema.sql into DealAlert structure
  const initialAlerts: DealAlert[] = dealHealthScores.map((dh, idx) => ({
    id: dh.id || `alert-${idx + 1}`,
    quotationCode: dh.quotationCode,
    customerName: dh.customerName,
    issue: dh.riskFactors[0] || (dh.overallScore < 50 ? 'Low health score signal' : 'Margin threshold caution'),
    flaggedDate: 'Sep 01',
    healthScore: dh.overallScore,
    status: idx === 0 ? 'Nudge sent' : idx === 1 ? 'Escalated to Manager' : 'Pending Action',
    reasons: dh.riskFactors.length > 0 ? dh.riskFactors : ['Quotation under review', 'Margin guardrail threshold'],
    recommendedAction: dh.recommendedActions[0] || 'Escalate to Sales Manager',
  }));

  const [alerts, setAlerts] = useState<DealAlert[]>(initialAlerts);
  const [selectedAlert, setSelectedAlert] = useState<DealAlert>(initialAlerts[0] || {
    id: 'alert-1',
    quotationCode: 'QT-2026-8492',
    customerName: 'Acme Corp',
    issue: 'Discount held in Manager Approval Queue',
    flaggedDate: 'Sep 01',
    healthScore: 78,
    status: 'Pending Action',
    reasons: ['Discount held in Manager Approval Queue', 'Hardware margin near rep threshold floor'],
    recommendedAction: 'Fast-track Manager Approval sign-off',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleNudgeRep = (alertId: string, customerName: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Nudge sent' } : a))
    );
    if (selectedAlert.id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: 'Nudge sent' });
    }
    setToastMessage(`Nudge notification sent to account representative for ${customerName}.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleEscalate = (alertId: string, customerName: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'Escalated to Manager' } : a))
    );
    if (selectedAlert.id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: 'Escalated to Manager' });
    }
    setToastMessage(`Deal for ${customerName} officially escalated to Sales Manager M. Shah.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Deal Health & Anomaly Dashboard</h1>
          <p className="page-subheading">
            Operational intelligence answering: <em>"Which deals are in danger and what should I do?"</em>
          </p>
        </div>

        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#ff6b72',
            backgroundColor: 'rgba(255,107,114,0.08)',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(255,107,114,0.2)',
          }}
        >
          High-Risk Deals: <strong className="font-mono">4 Flagged</strong>
        </div>
      </div>

      {toastMessage && (
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP THREE INDICATORS */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* Indicator 1: Stalled Deals */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Stalled Deals</span>
            <Clock size={16} style={{ color: '#f5b544' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#f5b544' }}>
            5 Stalled
          </div>
          <div className="kpi-sub-label">5 quotes idle 7+ days</div>
        </div>

        {/* Indicator 2: Discount Anomalies */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Discount Anomalies</span>
            <AlertTriangle size={16} style={{ color: '#ff6b72' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#ff6b72' }}>
            2 Anomalies
          </div>
          <div className="kpi-sub-label">2 above rep average</div>
        </div>

        {/* Indicator 3: Delivery Slippage */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Delivery Slippage</span>
            <ShieldAlert size={16} style={{ color: '#38d9ff' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#38d9ff' }}>
            3 Promises at Risk
          </div>
          <div className="kpi-sub-label">3 promises at risk</div>
        </div>
      </div>

      {/* COMPACT ALERT TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} style={{ color: '#ff6b72' }} /> High-Priority Flagged Deal Alerts
          </h3>
          <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
            Click row to view Deal Health Score breakdown
          </span>
        </div>

        <div className="table-glass-wrapper">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Deal</th>
                <th>Issue</th>
                <th>Flagged</th>
                <th className="number-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((item) => {
                const isSelected = item.id === selectedAlert.id;
                return (
                  <tr
                    key={item.id}
                    className={`clickable ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => setSelectedAlert(item)}
                    style={{
                      background: isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                    }}
                  >
                    <td>
                      <div style={{ fontWeight: 700, color: '#f5f7fa' }}>{item.customerName}</div>
                      <div
                        className="font-mono"
                        style={{ fontSize: '11px', color: '#38d9ff', cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenQuotation) onOpenQuotation(item.quotationCode);
                        }}
                      >
                        {item.quotationCode} ↗
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: item.issue.includes('Discount') ? '#ff6b72' : '#f5b544' }}>
                        {item.issue}
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px', color: '#9aa8ba' }}>
                      {item.flaggedDate}
                    </td>
                    <td className="number-cell" onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-glass btn-glass-secondary btn-sm"
                          onClick={() => handleNudgeRep(item.id, item.customerName)}
                        >
                          Nudge Rep
                        </button>
                        <button
                          className="btn-glass btn-glass-danger btn-sm"
                          onClick={() => handleEscalate(item.id, item.customerName)}
                        >
                          Escalate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEAL HEALTH SCORE INSPECTOR */}
      {selectedAlert && (
        <div className="glass-panel" style={{ padding: '24px' }}>
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
                  {selectedAlert.customerName}
                </h3>
                <span className="font-mono" style={{ fontSize: '14px', color: '#38d9ff' }}>
                  ({selectedAlert.quotationCode})
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                Issue Signal: <strong style={{ color: '#ff6b72' }}>{selectedAlert.issue}</strong> | Flagged: {selectedAlert.flaggedDate}
              </div>
            </div>

            {/* DEAL HEALTH SCORE VISUAL (38 / 100) */}
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
                  Deal Health Score
                </div>
                <div className="font-mono" style={{ fontSize: '26px', fontWeight: 900, color: selectedAlert.healthScore < 50 ? '#ff6b72' : '#f5b544' }}>
                  {selectedAlert.healthScore} / 100
                </div>
              </div>

              <div
                style={{
                  background: selectedAlert.healthScore < 50 ? 'rgba(255, 107, 114, 0.12)' : 'rgba(245, 181, 68, 0.12)',
                  border: `1px solid ${selectedAlert.healthScore < 50 ? 'rgba(255, 107, 114, 0.3)' : 'rgba(245, 181, 68, 0.3)'}`,
                  color: selectedAlert.healthScore < 50 ? '#ff6b72' : '#f5b544',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                {selectedAlert.healthScore < 50 ? 'At-Risk Deal' : 'Moderate Concern'}
              </div>
            </div>
          </div>

          {/* REASONS BREAKDOWN & RECOMMENDED ACTION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* REASONS LIST */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#ff6b72', fontWeight: 700, marginBottom: '10px', margin: 0 }}>
                Reasons for Low Health Score:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#f5f7fa', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedAlert.reasons.map((reason, idx) => (
                  <li key={idx} style={{ color: '#f5f7fa' }}>
                    <span style={{ color: '#ff6b72' }}>•</span> {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* RECOMMENDED ACTION CARD */}
            <div style={{ background: 'rgba(56, 217, 255, 0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(56, 217, 255, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, marginBottom: '8px', margin: 0 }}>
                  Recommended Action:
                </h4>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>
                  {selectedAlert.recommendedAction}
                </div>
                <p style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '4px', margin: 0 }}>
                  Trigger immediate executive override or re-assignment to unblock deal velocity.
                </p>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <button
                  className="btn-glass btn-glass-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleEscalate(selectedAlert.id, selectedAlert.customerName)}
                >
                  Escalate to Sales Manager
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

