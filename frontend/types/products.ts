import type { ID } from './index';

export type ProductCategory = 'Hardware' | 'Services' | 'Subscriptions';

export interface ProductItem {
  id: ID;
  name: string;
  sku: string;
  description?: string;
  category: ProductCategory;
  unitPrice: number;
  costPrice: number;
  stockAvailability: number;
  isSubscription: boolean;
  isActive?: boolean;
  recurringPeriod?: 'monthly' | 'annual';
}
