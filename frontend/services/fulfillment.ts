/**
 * Fulfillment Service Abstraction
 * Encapsulates multi-warehouse inventory split calculations and stock allocation.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/fulfillment).
 */

import { MOCK_FULFILLMENT_DATA } from '@/data/mockFulfillmentData';
import type { QuotationFulfillmentData, ProductFulfillmentAllocation } from '@/types';

let mockFulfillmentState: QuotationFulfillmentData[] = Object.values(MOCK_FULFILLMENT_DATA);

export const fulfillmentService = {
  async getFulfillmentData(): Promise<QuotationFulfillmentData[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockFulfillmentState];
  },

  async getByQuotationId(quotationId: string): Promise<QuotationFulfillmentData | null> {
    await new Promise((r) => setTimeout(r, 100));
    return (
      mockFulfillmentState.find(
        (f) =>
          f.quotationId === quotationId ||
          f.quotationNumber.toLowerCase() === quotationId.toLowerCase()
      ) || null
    );
  },

  async saveWarehouseSplit(
    quotationId: string,
    updatedItems: ProductFulfillmentAllocation[]
  ): Promise<QuotationFulfillmentData> {
    await new Promise((r) => setTimeout(r, 250));
    const idx = mockFulfillmentState.findIndex(
      (f) => f.quotationId === quotationId || f.quotationNumber === quotationId
    );

    if (idx === -1) {
      throw new Error(`Fulfillment record for quote ${quotationId} not found`);
    }

    const updated: QuotationFulfillmentData = {
      ...mockFulfillmentState[idx],
      status: 'partially_allocated',
      items: updatedItems,
    };

    mockFulfillmentState[idx] = updated;
    return updated;
  },
};
