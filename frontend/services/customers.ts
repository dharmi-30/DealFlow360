/**
 * Customers Service Abstraction
 * Encapsulates customer accounts queries and CRUD operations.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/customers).
 */

import { MOCK_CUSTOMERS } from '@/data/mockCustomersData';
import type { CustomerAccount } from '@/types';

let mockCustomersState: CustomerAccount[] = [...MOCK_CUSTOMERS];

export const customersService = {
  async getCustomers(search?: string): Promise<CustomerAccount[]> {
    await new Promise((r) => setTimeout(r, 150));
    if (!search) return [...mockCustomersState];
    const q = search.toLowerCase();
    return mockCustomersState.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  },

  async getCustomerById(id: string): Promise<CustomerAccount | null> {
    await new Promise((r) => setTimeout(r, 100));
    return mockCustomersState.find((c) => c.id === id) || null;
  },

  async createCustomer(payload: Omit<CustomerAccount, 'id'>): Promise<CustomerAccount> {
    await new Promise((r) => setTimeout(r, 250));
    const newCustomer: CustomerAccount = {
      ...payload,
      id: `cust_${Date.now()}`,
    };
    mockCustomersState = [newCustomer, ...mockCustomersState];
    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<CustomerAccount>): Promise<CustomerAccount> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockCustomersState.findIndex((c) => c.id === id);
    if (idx === -1) {
      throw new Error(`Customer with id ${id} not found`);
    }
    const updated = { ...mockCustomersState[idx], ...updates };
    mockCustomersState[idx] = updated;
    return updated;
  },

  async deleteCustomer(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    mockCustomersState = mockCustomersState.filter((c) => c.id !== id);
    return true;
  },
};
