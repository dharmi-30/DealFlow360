/**
 * Quotations Service Abstraction
 * Encapsulates quote list, detail, and pipeline management.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/quotations).
 */

import { MOCK_QUOTATIONS } from '@/data/mockQuotationData';
import type { QuotationDetail, QuotationStatus } from '@/types';

let mockQuotationsState: QuotationDetail[] = [...MOCK_QUOTATIONS];

export const quotationsService = {
  async getQuotations(filters?: { status?: QuotationStatus | 'all'; search?: string }): Promise<QuotationDetail[]> {
    await new Promise((r) => setTimeout(r, 150));
    let result = [...mockQuotationsState];

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((q) => q.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (item) =>
          item.number.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q)
      );
    }
    return result;
  },

  async getQuotationById(id: string): Promise<QuotationDetail | null> {
    await new Promise((r) => setTimeout(r, 100));
    return mockQuotationsState.find((q) => q.id === id || q.number.toLowerCase() === id.toLowerCase()) || null;
  },

  async createQuotation(payload: Partial<QuotationDetail>): Promise<QuotationDetail> {
    await new Promise((r) => setTimeout(r, 300));
    const now = new Date().toISOString();
    const newQuote: QuotationDetail = {
      id: `qt_${Date.now()}`,
      number: `QT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.customerName || 'Acme Enterprises Inc.',
      customerContact: payload.customerContact || 'Johnathan Vance',
      customerEmail: payload.customerEmail || 'jvance@acme-corp.com',
      companyName: payload.companyName || 'Acme Enterprises Inc.',
      salesRep: payload.salesRep || {
        id: 'usr_01',
        name: 'Alexander Vance',
        email: 'avance@dealflow360.io',
        role: 'sales_rep',
      },
      totalAmount: payload.totalAmount || 0,
      subtotal: payload.subtotal || 0,
      taxAmount: payload.taxAmount || 0,
      marginPercentage: payload.marginPercentage || 35.0,
      discountPercentage: payload.discountPercentage || 0,
      riskLevel: payload.riskLevel || 'low',
      status: payload.status || 'draft',
      createdAt: now,
      updatedAt: now,
      validUntil: payload.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      items: payload.items || [],
      approvalHistory: payload.approvalHistory || [],
      fulfillmentDetails: payload.fulfillmentDetails || {
        warehouseName: 'Main Hub East',
        status: 'pending_allocation',
        allocatedCount: 0,
        totalCount: payload.items?.length || 0,
      },
      billingDetails: payload.billingDetails || {
        status: 'unbilled',
      },
      negotiationComments: payload.negotiationComments || [],
      activityLogs: payload.activityLogs || [
        {
          id: `act_${Date.now()}`,
          action: 'Quotation Created',
          performedBy: payload.salesRep?.name || 'Alexander Vance',
          timestamp: now,
        },
      ],
    };
    mockQuotationsState = [newQuote, ...mockQuotationsState];
    return newQuote;
  },

  async updateQuotation(id: string, updates: Partial<QuotationDetail>): Promise<QuotationDetail> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockQuotationsState.findIndex((q) => q.id === id || q.number === id);
    if (idx === -1) {
      throw new Error(`Quotation with id ${id} not found`);
    }
    const updated = {
      ...mockQuotationsState[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    mockQuotationsState[idx] = updated;
    return updated;
  },

  async deleteQuotation(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    mockQuotationsState = mockQuotationsState.filter((q) => q.id !== id && q.number !== id);
    return true;
  },
};
