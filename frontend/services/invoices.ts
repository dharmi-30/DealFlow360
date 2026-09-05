/**
 * Invoices Service Abstraction
 * Encapsulates billing invoices, payment processing status, and activity logs.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/invoices).
 */

import { MOCK_INVOICES } from '@/data/mockInvoiceData';
import type { InvoiceDetail } from '@/types';

let mockInvoicesState: InvoiceDetail[] = [...MOCK_INVOICES];

export const invoicesService = {
  async getInvoices(): Promise<InvoiceDetail[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockInvoicesState];
  },

  async getInvoiceById(id: string): Promise<InvoiceDetail | null> {
    await new Promise((r) => setTimeout(r, 100));
    return (
      mockInvoicesState.find(
        (inv) =>
          inv.id === id ||
          inv.invoiceNumber.toLowerCase() === id.toLowerCase()
      ) || null
    );
  },

  async recordPayment(id: string, amount: number): Promise<InvoiceDetail> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockInvoicesState.findIndex(
      (inv) => inv.id === id || inv.invoiceNumber === id
    );
    if (idx === -1) throw new Error(`Invoice ${id} not found`);

    const current = mockInvoicesState[idx];
    const newPaidAmount = current.paidAmount + amount;
    const isFull = newPaidAmount >= current.totalAmount;

    const updated: InvoiceDetail = {
      ...current,
      paidAmount: newPaidAmount,
      status: isFull ? 'paid' : 'partially_paid',
      activityLogs: [
        {
          id: `log_${Date.now()}`,
          action: `Payment recorded: $${amount.toLocaleString()}`,
          performedBy: 'Finance Ops',
          timestamp: new Date().toISOString(),
        },
        ...current.activityLogs,
      ],
    };

    mockInvoicesState[idx] = updated;
    return updated;
  },
};
