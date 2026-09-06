import React, { useState } from 'react';
import { ApprovalRecord } from '../../types';
import { EmptyState } from '../common/EmptyState';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

interface ApprovalsViewProps {
  approvals: ApprovalRecord[];
  onApprove: (approvalId: string, rationale: string) => void;
  onReject: (approvalId: string, rationale: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  onApprove,
  onReject,
}) => {
  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const approvedApprovals = approvals.filter((a) => a.status === 'approved');
  const rejectedApprovals = approvals.filter((a) => a.status === 'rejected');

  const [selectedItem, setSelectedItem] = useState<ApprovalRecord | null>(approvals[0] || null);
  const [rationaleInput, setRationaleInput] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleApprove = () => {
    if (!selectedItem) return;
    onApprove(selectedItem.id, rationaleInput || 'Approved per commercial delegation policy.');
    setActionNotice(`Approval granted for ${selectedItem.quotationCode}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleReject = () => {
    if (!selectedItem) return;
    onReject(selectedItem.id, rationaleInput || 'Rejected per commercial discount ceiling limits.');
    setActionNotice(`Approval rejected for ${selectedItem.quotationCode}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Top Page Header */}
      <div className="page-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, letterSpacing: '0.05em' }}>
              Governance & Compliance
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Discount Governance & Compliance</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
            Approval Router
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#31d38a', backgroundColor: 'rgba(49,211,138,0.12)', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(49,211,138,0.3)', fontWeight: 600 }}>
          <ShieldCheck size={16} /> Commercial Delegation Active
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="kpi-glass-card" style={{ borderLeft: '3px solid #f5b544' }}>
          <div className="kpi-head" style={{ marginBottom: '6px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 600 }}>Pending Review</span>
            <CheckSquare size={16} style={{ color: '#f5b544' }} />
          </div>
          <div className="kpi-main-val font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#f5b544' }}>
            {pendingApprovals.length} Pending
          </div>
          <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '4px' }}>
            Requires manager sign-off action
          </div>
        </div>

        <div className="kpi-glass-card" style={{ borderLeft: '3px solid #ff6b72' }}>
          <div className="kpi-head" style={{ marginBottom: '6px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 600 }}>Rejected / Hold</span>
            <XCircle size={16} style={{ color: '#ff6b72' }} />
          </div>
          <div className="kpi-main-val font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#ff6b72' }}>
            {rejectedApprovals.length} Rejected
          </div>
          <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '4px' }}>
            Requires sales rep justification
          </div>
        </div>

        <div className="kpi-glass-card" style={{ borderLeft: '3px solid #31d38a' }}>
          <div className="kpi-head" style={{ marginBottom: '6px' }}>
            <span className="kpi-label" style={{ fontSize: '13px', color: '#9aa8ba', fontWeight: 600 }}>Approved YTD</span>
            <CheckCircle2 size={16} style={{ color: '#31d38a' }} />
          </div>
          <div className="kpi-main-val font-mono" style={{ fontSize: '24px', fontWeight: 800, color: '#31d38a' }}>
            {approvedApprovals.length} Approved
          </div>
          <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '4px' }}>
            Audit compliance log reconciled
          </div>
        </div>
      </div>

      {actionNotice && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(49, 211, 138, 0.15)',
            border: '1px solid rgba(49, 211, 138, 0.3)',
            borderRadius: '6px',
            color: '#31d38a',
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '20px',
          }}
        >
          {actionNotice}
        </div>
      )}

      {/* APPROVAL LIST TABLE */}
      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare size={16} style={{ color: '#38d9ff' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
              Governance Approval Queue
            </h3>
          </div>
          <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
            Select a row to inspect flagged discount details
          </span>
        </div>

        {approvals.length === 0 ? (
          <EmptyState
            title="No approvals in queue"
            description="All commercial proposals are currently within standard representative limits."
          />
        ) : (
          <div className="table-glass-wrapper">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Quotation</th>
                  <th>Customer</th>
                  <th>Requested Discount</th>
                  <th>Margin %</th>
                  <th>Stage / Tier</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((item) => {
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="clickable"
                      onClick={() => setSelectedItem(item)}
                      style={{
                        background: isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                      }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: '#2f8cff' }}>
                        {item.quotationCode}
                      </td>
                      <td>
                        <strong style={{ color: '#f5f7fa', fontWeight: 600 }}>{item.customerName}</strong>
                      </td>
                      <td className="font-mono" style={{ color: item.requestedDiscountPct > 15 ? '#ff6b72' : '#f5b544', fontWeight: 700 }}>
                        {item.requestedDiscountPct}%
                      </td>
                      <td className="font-mono" style={{ color: '#31d38a', fontWeight: 600 }}>
                        {item.marginPct}%
                      </td>
                      <td>
                        <span className="badge-glass badge-glass-neutral">{item.tier}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: item.status === 'approved' ? 'rgba(49, 211, 138, 0.15)' : item.status === 'rejected' ? 'rgba(255, 107, 114, 0.15)' : 'rgba(245, 181, 68, 0.15)',
                            color: item.status === 'approved' ? '#31d38a' : item.status === 'rejected' ? '#ff6b72' : '#f5b544',
                          }}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-glass btn-glass-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(item);
                          }}
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                        >
                          Inspect <ChevronRight size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* APPROVAL DETAIL INSPECTOR PANEL */}
      {selectedItem && (
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: '#38d9ff' }}>
                  {selectedItem.quotationCode}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                <strong style={{ fontSize: '16px', color: '#f5f7fa' }}>{selectedItem.customerName}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                Approval Inspector & Risk Analysis
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(245, 181, 68, 0.15)',
                  color: '#f5b544',
                  border: '1px solid rgba(245, 181, 68, 0.3)',
                }}
              >
                Governance Role: {selectedItem.tier}
              </div>
            </div>
          </div>

          {/* SECTION: "Why This Quote Was Flagged" */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={16} style={{ color: '#f5b544' }} />
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                Why This Quote Was Flagged
              </h4>
            </div>

            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <p style={{ fontSize: '13px', color: '#f5f7fa', margin: 0 }}>
                {selectedItem.triggerReason}
              </p>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#9aa8ba', display: 'flex', gap: '16px' }}>
                <span>Grand Total: <strong style={{ color: '#38d9ff' }}>${selectedItem.grandTotal.toLocaleString()}</strong></span>
                <span>Margin: <strong style={{ color: '#31d38a' }}>{selectedItem.marginPct}%</strong></span>
                <span>Submitted At: <strong>{selectedItem.submittedAt}</strong></span>
              </div>
            </div>
          </div>

          {/* RATIONALE INPUT & ACTION BUTTONS */}
          {selectedItem.status === 'pending' && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: '#9aa8ba', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Reviewer Rationale & Audit Comments:
                </label>
                <input
                  type="text"
                  className="input-glass-select"
                  value={rationaleInput}
                  onChange={(e) => setRationaleInput(e.target.value)}
                  placeholder="Enter audit rationale for approval or rejection..."
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  className="btn-glass btn-glass-danger"
                  onClick={handleReject}
                  style={{ fontWeight: 600 }}
                >
                  <XCircle size={14} /> Reject Quotation
                </button>

                <button
                  className="btn-glass btn-glass-success"
                  onClick={handleApprove}
                  style={{ fontWeight: 600 }}
                >
                  <CheckCircle2 size={14} /> Approve Quotation
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
