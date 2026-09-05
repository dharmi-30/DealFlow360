/**
 * Approvals Service Abstraction
 * Encapsulates quotation approval requests, risk score calculation, and decision flows.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/approvals).
 */

import { MOCK_APPROVAL_REQUESTS } from '@/data/mockApprovalData';
import type { ApprovalRequestDetail, QuotationStatus } from '@/types';

let mockApprovalsState: ApprovalRequestDetail[] = [...MOCK_APPROVAL_REQUESTS];

export const approvalsService = {
  async getApprovals(status?: string): Promise<ApprovalRequestDetail[]> {
    await new Promise((r) => setTimeout(r, 150));
    if (!status || status === 'all') return [...mockApprovalsState];
    return mockApprovalsState.filter((a) => a.status === status);
  },

  async getApprovalById(id: string): Promise<ApprovalRequestDetail | null> {
    await new Promise((r) => setTimeout(r, 100));
    return mockApprovalsState.find((a) => a.id === id || a.quoteId === id || a.quoteNumber.toLowerCase() === id.toLowerCase()) || null;
  },

  async approveQuote(id: string, comment?: string, role: string = 'Sales Manager'): Promise<ApprovalRequestDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockApprovalsState.findIndex((a) => a.id === id || a.quoteId === id);
    if (idx === -1) throw new Error(`Approval request ${id} not found`);

    const now = new Date().toISOString();
    const current = mockApprovalsState[idx];

    // Update steps
    const updatedSteps = current.approvalSteps.map((step) => {
      if (step.role.toLowerCase() === role.toLowerCase() || step.status === 'pending') {
        return { ...step, status: 'approved' as const, timestamp: now, comment: comment || 'Approved by decision maker' };
      }
      return step;
    });

    const isFullyApproved = updatedSteps.every((s) => s.status === 'approved');
    const newStatus: QuotationStatus = isFullyApproved ? 'approved' : 'pending_approval';

    const updated: ApprovalRequestDetail = {
      ...current,
      status: newStatus,
      approvalSteps: updatedSteps,
      auditTrail: [
        {
          id: `audit_${Date.now()}`,
          performedBy: role,
          action: 'Approved Quotation',
          timestamp: now,
          comment,
        },
        ...current.auditTrail,
      ],
    };

    mockApprovalsState[idx] = updated;
    return updated;
  },

  async rejectQuote(id: string, comment?: string, role: string = 'Sales Manager'): Promise<ApprovalRequestDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockApprovalsState.findIndex((a) => a.id === id || a.quoteId === id);
    if (idx === -1) throw new Error(`Approval request ${id} not found`);

    const now = new Date().toISOString();
    const current = mockApprovalsState[idx];

    const updatedSteps = current.approvalSteps.map((step) => {
      if (step.role.toLowerCase() === role.toLowerCase() || step.status === 'pending') {
        return { ...step, status: 'rejected' as const, timestamp: now, comment: comment || 'Rejected' };
      }
      return step;
    });

    const updated: ApprovalRequestDetail = {
      ...current,
      status: 'rejected',
      approvalSteps: updatedSteps,
      auditTrail: [
        {
          id: `audit_${Date.now()}`,
          performedBy: role,
          action: 'Rejected Quotation',
          timestamp: now,
          comment,
        },
        ...current.auditTrail,
      ],
    };

    mockApprovalsState[idx] = updated;
    return updated;
  },

  async requestRevision(id: string, comment?: string, role: string = 'Sales Manager'): Promise<ApprovalRequestDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockApprovalsState.findIndex((a) => a.id === id || a.quoteId === id);
    if (idx === -1) throw new Error(`Approval request ${id} not found`);

    const now = new Date().toISOString();
    const current = mockApprovalsState[idx];

    const updatedSteps = current.approvalSteps.map((step) => {
      if (step.role.toLowerCase() === role.toLowerCase() || step.status === 'pending') {
        return { ...step, status: 'changes_requested' as const, timestamp: now, comment: comment || 'Revision requested' };
      }
      return step;
    });

    const updated: ApprovalRequestDetail = {
      ...current,
      status: 'draft',
      approvalSteps: updatedSteps,
      auditTrail: [
        {
          id: `audit_${Date.now()}`,
          performedBy: role,
          action: 'Returned for Revision',
          timestamp: now,
          comment,
        },
        ...current.auditTrail,
      ],
    };

    mockApprovalsState[idx] = updated;
    return updated;
  },
};
