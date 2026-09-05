/**
 * Warehouses Service Abstraction
 * Encapsulates warehouse facility configs and stock availability.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/configuration/warehouses).
 */

import { MOCK_WAREHOUSES } from '@/data/mockConfigurationData';
import type { WarehouseConfig } from '@/types';

let mockWarehousesState: WarehouseConfig[] = [...MOCK_WAREHOUSES];

export const warehousesService = {
  async getWarehouses(): Promise<WarehouseConfig[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockWarehousesState];
  },

  async getWarehouseById(id: string): Promise<WarehouseConfig | null> {
    await new Promise((r) => setTimeout(r, 100));
    return mockWarehousesState.find((w) => w.id === id || w.code.toLowerCase() === id.toLowerCase()) || null;
  },

  async createWarehouse(payload: Omit<WarehouseConfig, 'id'>): Promise<WarehouseConfig> {
    await new Promise((r) => setTimeout(r, 250));
    const newWarehouse: WarehouseConfig = {
      ...payload,
      id: `wh_${Date.now()}`,
    };
    mockWarehousesState = [newWarehouse, ...mockWarehousesState];
    return newWarehouse;
  },

  async updateWarehouse(id: string, updates: Partial<WarehouseConfig>): Promise<WarehouseConfig> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockWarehousesState.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Warehouse with id ${id} not found`);

    const updated = { ...mockWarehousesState[idx], ...updates };
    mockWarehousesState[idx] = updated;
    return updated;
  },
};
