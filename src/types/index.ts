export type ModuleType =
  | 'dashboard'
  | 'quotations'
  | 'approvals'
  | 'fulfillment'
  | 'subscriptions'
  | 'invoices'
  | 'reports'
  | 'products';

export type ViewMode = 'internal' | 'customer';

export type AccountType = 'internal' | 'customer';

export type UserRoleType =
  | 'ADMIN'
  | 'SALES_OPS_DIRECTOR'
  | 'SALES_MANAGER'
  | 'SALES_REP'
  | 'FINANCE'
  | 'CUSTOMER';

export interface UserAuthData {
  id: string;
  email: string;
  name: string;
  accountType: AccountType;
  role: UserRoleType;
  roleTitle: string;
  company: string;
  customerId?: string;
  permissions: string[];
  token?: string;
  avatarUrl?: string;
}

export type QuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_customer'
  | 'customer_countered'
  | 'accepted'
  | 'rejected'
  | 'fulfilled';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export type FulfillmentStatus =
  | 'pending_pick'
  | 'packing'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'on_hold';

export type SubscriptionStatus =
  | 'active'
  | 'pending_renewal'
  | 'canceled'
  | 'expansion_requested';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue';

export type WarehouseHub = 'Dallas (HUB-01)' | 'Chicago (HUB-02)' | 'Frankfurt (HUB-03)';

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Hardware' | 'Software Subscription' | 'Professional Services' | 'Support' | string;
  description: string;
  listPrice: number;
  cogs: number; // Cost of Goods Sold
  minMarginPct: number; // Guardrail min margin threshold
  defaultDiscountPct: number;
  upsellIds: string[];
  crossSellIds: string[];
  inStock: number;
  unitOfMeasure?: string;
  quantityOnHand?: number;
  status?: 'Active' | 'Inactive' | 'Archived';
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactName: string;
  contactEmail: string;
  tier: 'Enterprise' | 'Mid-Market' | 'Strategic';
  creditLimit: number;
  openBalance: number;
  accountManager: string;
  shippingAddress: string;
}

export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  cogs: number;
  discountPct: number;
  lineTotal: number;
  marginPct: number;
  isUpsellRecommendation?: boolean;
}

export interface NegotiationMessage {
  id: string;
  quotationId: string;
  senderRole: 'customer' | 'sales_rep';
  senderName: string;
  timestamp: string;
  message: string;
  proposedDiscountPct?: number;
}

export interface Quotation {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  customerContact: string;
  customerEmail: string;
  items: QuotationItem[];
  subtotal: number;
  discountAmount: number;
  grandTotal: number;
  totalCogs: number;
  marginPct: number;
  status: QuotationStatus;
  requiresApproval: boolean;
  approvalReason?: string;
  createdDate: string;
  validUntil: string;
  salesRep: string;
  warehouseHub: WarehouseHub;
  deliveryRequestDate?: string;
  customerComments?: string;
  negotiationHistory: NegotiationMessage[];
  shippingAddress?: string;
}

export interface ApprovalRecord {
  id: string;
  quotationId: string;
  quotationCode: string;
  customerName: string;
  salesRep: string;
  requestedDiscountPct: number;
  marginPct: number;
  grandTotal: number;
  triggerReason: string;
  tier: 'Manager Approval' | 'VP Sales Approval' | 'Finance Controller Hold';
  status: ApprovalStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rationale?: string;
}

export interface FulfillmentRecord {
  id: string;
  quotationId: string;
  quotationCode: string;
  customerName: string;
  warehouseHub: WarehouseHub;
  itemsCount: number;
  status: FulfillmentStatus;
  carrier?: string;
  trackingNumber?: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface SubscriptionRecord {
  id: string;
  code: string;
  customerName: string;
  planName: string;
  mrr: number;
  arr: number;
  billingCycle: 'Monthly' | 'Annual';
  startDate: string;
  renewalDate: string;
  status: SubscriptionStatus;
  autoRenew: boolean;
  seats: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  quotationCode: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentTerms: 'Net 30' | 'Net 60' | 'Immediate';
}

export interface DealHealthScore {
  id: string;
  quotationCode: string;
  customerName: string;
  grandTotal: number;
  overallScore: number; // 0 - 100
  marginScore: number;
  velocityScore: number;
  engagementScore: number;
  riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  riskFactors: string[];
  recommendedActions: string[];
}
