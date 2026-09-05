import type { ID, ISODateString, User } from './index';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type QuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'negotiation'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'confirmed'
  | 'cancelled';

export interface QuotationItemDetail {
  id: ID;
  productId: ID;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage 0-100
  total: number;
}

export interface QuotationDetail {
  id: ID;
  number: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  companyName: string;
  salesRep: User;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  marginPercentage: number;
  discountPercentage: number;
  riskLevel: RiskLevel;
  status: QuotationStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  validUntil: ISODateString;
  items: QuotationItemDetail[];
  approvalHistory: {
    role: string;
    approverName?: string;
    status: 'approved' | 'pending' | 'rejected' | 'changes_requested';
    timestamp?: string;
    comment?: string;
  }[];
  fulfillmentDetails: {
    warehouseName: string;
    status: 'pending_allocation' | 'allocated' | 'partially_shipped' | 'fulfilled';
    trackingNumber?: string;
    allocatedCount: number;
    totalCount: number;
  };
  billingDetails: {
    invoiceNumber?: string;
    status: 'unbilled' | 'invoice_generated' | 'partially_paid' | 'paid';
    dueDate?: string;
  };
  negotiationComments: {
    id: ID;
    author: string;
    role: 'client' | 'sales_rep' | 'manager';
    message: string;
    timestamp: string;
  }[];
  activityLogs: {
    id: ID;
    action: string;
    performedBy: string;
    timestamp: string;
  }[];
}
