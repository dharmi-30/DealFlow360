import type { ID, ISODateString, QuotationStatus, RiskLevel, User } from './index';

export interface ApprovalStepDetail {
  id: string;
  role: string;
  approverName?: string;
  status: 'approved' | 'pending' | 'rejected' | 'changes_requested';
  timestamp?: string;
  comment?: string;
  requiredIf?: string;
}

export interface RiskBreakdown {
  blendedScore: number; // 0 - 100
  discountRisk: { score: number; label: string; details: string };
  marginRisk: { score: number; label: string; details: string };
  customerTierRisk: { score: number; label: string; details: string };
  inventoryRisk: { score: number; label: string; details: string };
}

export interface ApprovalRequestDetail {
  id: ID;
  quoteId: ID;
  quoteNumber: string;
  customerName: string;
  customerCompany: string;
  salesRep: User;
  totalAmount: number;
  discountPercentage: number;
  marginPercentage: number;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  requiredApprovalRole: string; // e.g. "Sales Manager" or "Finance Director"
  waitingTime: string;
  status: QuotationStatus;
  createdAt: ISODateString;
  requiresFinanceApproval: boolean;
  riskBreakdown: RiskBreakdown;
  approvalSteps: ApprovalStepDetail[];
  auditTrail: {
    id: string;
    performedBy: string;
    action: string;
    timestamp: string;
    comment?: string;
  }[];
}
