/**
 * Negotiations Service Abstraction
 * Encapsulates client portal counter-proposals, line-item change requests, and quote confirmations.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/portal/negotiations).
 */

import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import type { QuotationDetail } from '@/types';

let mockNegotiationsState: QuotationDetail[] = [...MOCK_QUOTATIONS];

export interface ChangeRequestPayload {
  lineId?: string;
  comment: string;
  requestedQuantity?: number;
  requestedDiscount?: number;
  customerName?: string;
}

export const negotiationsService = {
  async getNegotiationQuote(id: string): Promise<QuotationDetail | null> {
    await new Promise((r) => setTimeout(r, 120));
    return (
      mockNegotiationsState.find(
        (q) =>
          q.id === id ||
          q.number.toLowerCase() === id.toLowerCase()
      ) || null
    );
  },

  async submitChangeRequest(
    quoteId: string,
    payload: ChangeRequestPayload
  ): Promise<QuotationDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockNegotiationsState.findIndex(
      (q) => q.id === quoteId || q.number === quoteId
    );
    if (idx === -1) throw new Error(`Quotation ${quoteId} not found`);

    const current = mockNegotiationsState[idx];
    const now = new Date().toISOString();

    const updatedItems = current.items.map((item) => {
      if (payload.lineId && item.id === payload.lineId) {
        const qty = payload.requestedQuantity ?? item.quantity;
        const disc = payload.requestedDiscount ?? item.discount;
        const total = item.unitPrice * qty * (1 - disc / 100);
        return { ...item, quantity: qty, discount: disc, total };
      }
      return item;
    });

    const newComment = {
      id: `neg_${Date.now()}`,
      author: payload.customerName || current.customerContact || 'Client Representative',
      role: 'client' as const,
      message: payload.comment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated: QuotationDetail = {
      ...current,
      items: updatedItems,
      status: 'negotiation',
      negotiationComments: [...current.negotiationComments, newComment],
      activityLogs: [
        {
          id: `act_${Date.now()}`,
          action: 'Client submitted change request',
          performedBy: payload.customerName || 'Client Representative',
          timestamp: now,
        },
        ...current.activityLogs,
      ],
    };

    mockNegotiationsState[idx] = updated;
    return updated;
  },

  async confirmQuotation(quoteId: string): Promise<QuotationDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockNegotiationsState.findIndex(
      (q) => q.id === quoteId || q.number === quoteId
    );
    if (idx === -1) throw new Error(`Quotation ${quoteId} not found`);

    const current = mockNegotiationsState[idx];
    const now = new Date().toISOString();

    const updated: QuotationDetail = {
      ...current,
      status: 'approved', // Confirmed & accepted by customer
      activityLogs: [
        {
          id: `act_${Date.now()}`,
          action: 'Quotation confirmed & accepted by customer',
          performedBy: current.customerContact,
          timestamp: now,
        },
        ...current.activityLogs,
      ],
    };

    mockNegotiationsState[idx] = updated;
    return updated;
  },
};
