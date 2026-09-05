import type { ID, ISODateString } from './index';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'pending_cancellation'
  | 'canceled';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionLineItem {
  id: string;
  name: string;
  sku: string;
  isRecurring: boolean; // true = recurring, false = one-time
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  recurringPeriod?: BillingCycle;
}

export interface BillingScheduleItem {
  id: string;
  billingDate: ISODateString;
  description: string;
  amount: number;
  status: 'scheduled' | 'invoiced' | 'paid' | 'pending';
  invoiceId?: string;
}

export interface SubscriptionDetail {
  id: string; // e.g. "sub_2026_01"
  subscriptionNumber: string; // e.g. "SUB-2026-0819"
  customerId: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  status: SubscriptionStatus;
  startDate: ISODateString;
  nextBillingDate: ISODateString;
  billingCycle: BillingCycle;
  quantity: number;
  recurringAmount: number;
  quoteNumber: string;
  lines: SubscriptionLineItem[];
  billingSchedule: BillingScheduleItem[];
}
