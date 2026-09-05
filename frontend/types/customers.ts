import type { ID } from './index';

export type CustomerTier = 'Bronze' | 'Silver' | 'Gold';

export type AccountStatus = 'active' | 'inactive' | 'on_hold';

export interface CustomerAccount {
  id: ID;
  name: string;
  company?: string;
  contactPerson: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  accountStatus?: AccountStatus;
  defaultDiscount: number; // percentage discount tier
  creditLimit: number;
}
