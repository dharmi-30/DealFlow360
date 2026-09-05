 import { supabase } from './supabase';
import { Quotation, ApprovalRecord, FulfillmentRecord, SubscriptionRecord, InvoiceRecord } from '../types';

export const fetchQuotationsFromSupabase = async (): Promise<Quotation[] | null> => {
  try {
    const { data, error } = await supabase.from('quotations').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    
    return data.map((q: any) => ({
      id: q.id,
      code: q.code,
      customerId: q.customer_id,
      customerName: q.customer_name,
      customerContact: q.customer_contact,
      customerEmail: q.customer_email,
      items: q.items || [],
      subtotal: Number(q.subtotal),
      discountAmount: Number(q.discount_amount),
      grandTotal: Number(q.grand_total),
      totalCogs: Number(q.total_cogs),
      marginPct: Number(q.margin_pct),
      status: q.status,
      requiresApproval: q.requires_approval,
      approvalReason: q.approval_reason,
      createdDate: q.created_date,
      validUntil: q.valid_until,
      salesRep: q.sales_rep,
      warehouseHub: q.warehouse_hub,
      deliveryRequestDate: q.delivery_request_date,
      customerComments: q.customer_comments,
      negotiationHistory: q.negotiation_history || [],
    }));
  } catch (err) {
    console.warn('Supabase fetch failed, using memory state:', err);
    return null;
  }
};

export const saveQuotationToSupabase = async (quotation: Quotation) => {
  try {
    const { error } = await supabase.from('quotations').insert({
      id: quotation.id,
      code: quotation.code,
      customer_id: quotation.customerId,
      customer_name: quotation.customerName,
      customer_contact: quotation.customerContact,
      customer_email: quotation.customerEmail,
      items: quotation.items,
      subtotal: quotation.subtotal,
      discount_amount: quotation.discountAmount,
      grand_total: quotation.grandTotal,
      total_cogs: quotation.totalCogs,
      margin_pct: quotation.marginPct,
      status: quotation.status,
      requires_approval: quotation.requiresApproval,
      approval_reason: quotation.approvalReason,
      created_date: quotation.createdDate,
      valid_until: quotation.validUntil,
      sales_rep: quotation.salesRep,
      warehouse_hub: quotation.warehouseHub,
      delivery_request_date: quotation.deliveryRequestDate,
      customer_comments: quotation.customerComments,
      negotiation_history: quotation.negotiationHistory,
    });
    if (error) console.warn('Could not insert quotation to Supabase:', error.message);
  } catch (err) {
    console.warn('Supabase insert failed:', err);
  }
};
