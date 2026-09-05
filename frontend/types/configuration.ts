import type { CustomerTier } from './customers';

export interface WarehouseConfig {
  id: string;
  name: string;
  code: string;
  location: string;
  status: 'active' | 'maintenance' | 'full_capacity';
  capacityUnits: number;
  currentStockUnits: number;
  inventoryBreakdown: {
    sku: string;
    productName: string;
    available: number;
    reserved: number;
    reorderPoint: number;
  }[];
}

export interface DiscountRuleConfig {
  id: string;
  ruleName: string;
  customerTier: CustomerTier;
  maxDiscountPercentage: number;
  categoryRestriction: string; // 'All Categories' | 'Hardware' | 'Services' | etc.
  approvalRequirement: 'auto_approved' | 'manager_approval' | 'executive_approval';
  status: 'active' | 'inactive';
}
