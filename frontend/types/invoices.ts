import type { ID, ISODateString } from './index';

export type InvoiceStatus =
  | 'paid'
  | 'pending'
  | 'past_due'
  | 'partially_paid'
  | 'draft';

export type InvoiceType =
  | 'subscription_recurring'
  | 'one_time_implementation'
  | 'hardware_license'
  | 'combined';

export interface InvoiceLineItem {
  id: string;
  description: string;
  type: 'recurring' | 'one_time';
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface InvoiceActivityLog {
  id: string;
  action: string;
  performedBy: string;
  timestamp: ISODateString;
}

export interface InvoiceDetail {
  id: string; // e.g. "inv_2026_104"
  invoiceNumber: string; // e.g. "INV-2026-0104"
  customerName: string;
  customerContact: string;
  customerEmail: string;
  quoteNumber: string;
  subscriptionNumber?: string;
  type: InvoiceType;
  issueDate: ISODateString;
  dueDate: ISODateString;
  status: InvoiceStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  lines: InvoiceLineItem[];
  activityLogs: InvoiceActivityLog[];
}
