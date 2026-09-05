'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  MessageSquare,
  Flame,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  StatusBadge,
  RiskIndicator,
  ApprovalStatus,
  Button,
  Modal,
  Textarea,
  ProgressBar,
  Avatar,
  useToast,
} from '@/components/ui';
import { MOCK_APPROVAL_REQUESTS } from '@/data/mockApprovalData';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ApprovalRequestDetail } from '@/types/approvals';

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const reqId = (params?.id as string) || 'app_req_01';

  // Find request detail or fallback
  const initialReq =
    MOCK_APPROVAL_REQUESTS.find((r) => r.id === reqId) || MOCK_APPROVAL_REQUESTS[0];

  const [request, setRequest] = React.useState<ApprovalRequestDetail>(initialReq);

  // Decision Modal state
  const [decisionType, setDecisionType] = React.useState<'approve' | 'reject' | 'revision' | null>(null);
  const [decisionNote, setDecisionNote] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleOpenDecisionModal = (type: 'approve' | 'reject' | 'revision') => {
    setDecisionType(type);
    setDecisionNote('');
  };

  const handleConfirmDecision = async () => {
    if (!decisionType) return;

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    setIsSubmitting(false);

    let newStatus = request.status;
    let toastMessage = '';

    if (decisionType === 'approve') {
      newStatus = 'approved';
      toastMessage = `Quotation ${request.quoteNumber} approved successfully.`;
    } else if (decisionType === 'reject') {
      newStatus = 'rejected';
      toastMessage = `Quotation ${request.quoteNumber} rejected.`;
    } else if (decisionType === 'revision') {
      newStatus = 'draft';
      toastMessage = `Quotation ${request.quoteNumber} returned to rep for revision.`;
    }

    // Add decision to audit trail
    const newAudit = {
      id: `aud_${Date.now()}`,
      performedBy: 'Dharmi Talaviya (Sales Manager)',
      action:
        decisionType === 'approve'
          ? 'Approved Proposal'
          : decisionType === 'reject'
          ? 'Rejected Proposal'
          : 'Returned for Revision',
      timestamp: 'Just now',
      comment: decisionNote || undefined,
    };

    setRequest((prev) => ({
      ...prev,
      status: newStatus,
      auditTrail: [newAudit, ...prev.auditTrail],
    }));

    setDecisionType(null);
    toast.success('Decision Recorded', toastMessage);
  };

  return (
    <AppShell title={`Approval ${request.quoteNumber}`} subtitle={request.customerName}>
      <PageHeader
        title={`Approval Request — ${request.quoteNumber}`}
        subtitle={`Submitted by ${request.salesRep.name} (${request.waitingTime})`}
        badge={<StatusBadge status={request.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/approvals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Queue</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="space-y-6">
        {/* HEADER SUMMARY CARD */}
        <GlassCard className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-l-4 border-l-amber-500">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Account</span>
            <p className="text-sm font-bold text-slate-100 mt-1 truncate">{request.customerName}</p>
            <p className="text-[10px] text-slate-500 truncate">{request.customerCompany}</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Value</span>
            <p className="text-base font-extrabold text-cyan-400 mt-1">{formatCurrency(request.totalAmount)}</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Discount %</span>
            <p className="text-sm font-bold text-red-400 mt-1">{request.discountPercentage}% Requested</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Gross Margin</span>
            <p className={`text-sm font-bold mt-1 ${request.marginPercentage < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
              {request.marginPercentage}%
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Risk Rating</span>
            <div className="mt-1 flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-400">{request.riskScore}/100</span>
              <RiskIndicator level={request.riskLevel} variant="compact" showLabel={false} />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Required Role</span>
            <p className="text-xs font-semibold text-violet-400 mt-1">{request.requiredApprovalRole}</p>
          </div>
        </GlassCard>

        {/* DECISION ACTION BAR (Quick Manager Actions) */}
        <GlassCard className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-cyan-500/30 ring-1 ring-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <UserCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100">Manager Authorization Required</h3>
              <p className="text-[11px] text-slate-400">Review risk score breakdown and record sign-off decision</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleOpenDecisionModal('reject')}
              disabled={request.status === 'rejected'}
            >
              <XCircle className="h-4 w-4" />
              <span>Reject Proposal</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenDecisionModal('revision')}
              disabled={request.status === 'draft'}
            >
              <RotateCcw className="h-4 w-4" />
              <span>Return for Revision</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenDecisionModal('approve')}
              disabled={request.status === 'approved'}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Authorize & Approve</span>
            </Button>
          </div>
        </GlassCard>

        {/* RISK PANEL & APPROVAL STEPS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* STRONG RISK PANEL (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Commercial Risk Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-400">Blended algorithmic risk scoring (0-100 scale)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold text-red-400">{request.riskBreakdown.blendedScore}</span>
                  <span className="text-xs text-slate-500 font-mono">/ 100</span>
                </div>
              </div>

              {/* Blended Score Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Blended Risk Rating</span>
                  <span className="font-bold text-red-400">HIGH RISK (Action Required)</span>
                </div>
                <ProgressBar value={request.riskBreakdown.blendedScore} max={100} size="md" variant="danger" />
              </div>

              {/* 4 Risk Sub-Components */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* 1. Discount Risk */}
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Discount Risk</span>
                    <span className="font-mono text-red-400 font-bold">{request.riskBreakdown.discountRisk.score}/100</span>
                  </div>
                  <p className="text-[11px] text-amber-400 font-medium">{request.riskBreakdown.discountRisk.label}</p>
                  <p className="text-[10px] text-slate-400">{request.riskBreakdown.discountRisk.details}</p>
                </div>

                {/* 2. Margin Risk */}
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Margin Risk</span>
                    <span className="font-mono text-red-400 font-bold">{request.riskBreakdown.marginRisk.score}/100</span>
                  </div>
                  <p className="text-[11px] text-red-400 font-medium">{request.riskBreakdown.marginRisk.label}</p>
                  <p className="text-[10px] text-slate-400">{request.riskBreakdown.marginRisk.details}</p>
                </div>

                {/* 3. Customer Tier Risk */}
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Customer Tier Risk</span>
                    <span className="font-mono text-emerald-400 font-bold">{request.riskBreakdown.customerTierRisk.score}/100</span>
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">{request.riskBreakdown.customerTierRisk.label}</p>
                  <p className="text-[10px] text-slate-400">{request.riskBreakdown.customerTierRisk.details}</p>
                </div>

                {/* 4. Inventory Risk */}
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Inventory Risk</span>
                    <span className="font-mono text-amber-400 font-bold">{request.riskBreakdown.inventoryRisk.score}/100</span>
                  </div>
                  <p className="text-[11px] text-amber-400 font-medium">{request.riskBreakdown.inventoryRisk.label}</p>
                  <p className="text-[10px] text-slate-400">{request.riskBreakdown.inventoryRisk.details}</p>
                </div>
              </div>
            </GlassCard>

            {/* AUDIT TRAIL TIMELINE */}
            <GlassCard className="p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Approval Audit History Timeline
              </h3>

              <div className="space-y-4 border-l-2 border-white/10 ml-2 pl-4">
                {request.auditTrail.map((log) => (
                  <div key={log.id} className="relative space-y-1 text-xs">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-4 ring-[#080d1a]" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{log.action}</span>
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                    <p className="text-cyan-400 font-medium">{log.performedBy}</p>
                    {log.comment && <p className="text-slate-400 italic bg-white/5 p-2 rounded">{log.comment}</p>}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* APPROVAL FLOW & STEPS (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-6 space-y-4">
              <div className="border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Multi-Stage Approval Pipeline
                </h3>
                <p className="text-[11px] text-slate-400">
                  {request.requiresFinanceApproval
                    ? '2-Stage Authorization Required (Sales Manager + Finance)'
                    : '1-Stage Authorization Required (Sales Manager)'}
                </p>
              </div>

              {/* Approval Steps List */}
              <div className="space-y-4">
                {request.approvalSteps.map((step, idx) => (
                  <div key={step.id} className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-300">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-200">{step.role}</h4>
                      </div>
                      <StatusBadge status={step.status === 'approved' ? 'approved' : step.status === 'rejected' ? 'rejected' : 'pending_approval'} />
                    </div>

                    {step.approverName && (
                      <p className="text-xs text-slate-400">
                        Approver: <span className="text-slate-200 font-semibold">{step.approverName}</span>
                      </p>
                    )}

                    {step.timestamp && <p className="text-[10px] text-slate-500">Timestamp: {step.timestamp}</p>}
                    {step.comment && <p className="text-xs text-slate-300 bg-white/5 p-2 rounded">{step.comment}</p>}
                    {step.requiredIf && <p className="text-[10px] text-amber-400 italic">{step.requiredIf}</p>}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DECISION MODAL */}
      <Modal
        isOpen={decisionType !== null}
        onClose={() => setDecisionType(null)}
        title={
          decisionType === 'approve'
            ? 'Authorize Quotation Proposal'
            : decisionType === 'reject'
            ? 'Reject Commercial Proposal'
            : 'Return Proposal for Revision'
        }
        description={`Record manager decision for ${request.quoteNumber} (${request.customerName})`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDecisionType(null)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === 'reject' ? 'danger' : 'primary'}
              size="sm"
              loading={isSubmitting}
              onClick={handleConfirmDecision}
            >
              Confirm {decisionType === 'approve' ? 'Approval' : decisionType === 'reject' ? 'Rejection' : 'Revision'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
            <span className="text-slate-400">Target Proposal:</span>
            <p className="font-bold text-slate-100">{request.quoteNumber} — {formatCurrency(request.totalAmount)}</p>
            <p className="text-[11px] text-red-400">Requested Discount: {request.discountPercentage}%</p>
          </div>

          <Textarea
            label="Decision Notes / Revision Instructions (Optional)"
            placeholder="Provide context or instructions for the sales representative..."
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
          />
        </div>
      </Modal>
    </AppShell>
  );
}
