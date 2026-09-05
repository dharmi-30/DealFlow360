/**
 * Products Service Abstraction
 * Encapsulates master product catalog queries and mutations.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/products).
 */

import { MOCK_PRODUCTS } from '@/data/mockProductsData';
import type { ProductItem, ProductCategory } from '@/types';

let mockProductsState: ProductItem[] = [...MOCK_PRODUCTS];

export const productsService = {
  async getProducts(params?: { category?: string; search?: string }): Promise<ProductItem[]> {
    await new Promise((r) => setTimeout(r, 150));
    let result = [...mockProductsState];

    if (params?.category && params.category !== 'All') {
      result = result.filter((p) => p.category === params.category);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }
    return result;
  },

  async getProductById(id: string): Promise<ProductItem | null> {
    await new Promise((r) => setTimeout(r, 100));
    return mockProductsState.find((p) => p.id === id) || null;
  },

  async createProduct(payload: Omit<ProductItem, 'id'>): Promise<ProductItem> {
    await new Promise((r) => setTimeout(r, 250));
    const newProduct: ProductItem = {
      ...payload,
      id: `prod_${Date.now()}`,
    };
    mockProductsState = [newProduct, ...mockProductsState];
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<ProductItem>): Promise<ProductItem> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockProductsState.findIndex((p) => p.id === id);
    if (idx === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    const updated = { ...mockProductsState[idx], ...updates };
    mockProductsState[idx] = updated;
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    mockProductsState = mockProductsState.filter((p) => p.id !== id);
    return true;
  },
};
