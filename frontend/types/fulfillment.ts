import type { ID, ISODateString } from './index';

export type FulfillmentStatus =
  | 'pending_allocation'
  | 'partially_allocated'
  | 'allocated'
  | 'backordered'
  | 'fulfilled';

export interface WarehouseStockItem {
  warehouseId: string;
  warehouseName: string;
  location: string;
  availableStock: number;
  allocatedQuantity: number;
  shipmentCount: number;
  estimatedShippingCost: number;
}

export interface ProductFulfillmentAllocation {
  productId: string;
  productName: string;
  sku: string;
  orderedQuantity: number;
  totalAvailableStock: number;
  backorderQuantity: number;
  warehouseSplits: WarehouseStockItem[];
}

export interface QuotationFulfillmentData {
  quotationId: string;
  quotationNumber: string;
  customerName: string;
  orderValue: number;
  status: FulfillmentStatus;
  createdAt: ISODateString;
  items: ProductFulfillmentAllocation[];
  incomingStockAlert?: {
    warehouseName: string;
    quantity: number;
    expectedDate: string;
    poNumber: string;
  };
}
