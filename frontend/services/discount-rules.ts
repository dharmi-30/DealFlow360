/**
 * Discount Rules Service Abstraction
 * Encapsulates max discount policies per customer tier and approval rules.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/configuration/discount-rules).
 */

import { MOCK_DISCOUNT_RULES } from '@/data/mockConfigurationData';
import type { DiscountRuleConfig } from '@/types';

let mockDiscountRulesState: DiscountRuleConfig[] = [...MOCK_DISCOUNT_RULES];

export const discountRulesService = {
  async getDiscountRules(): Promise<DiscountRuleConfig[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockDiscountRulesState];
  },

  async createDiscountRule(payload: Omit<DiscountRuleConfig, 'id'>): Promise<DiscountRuleConfig> {
    await new Promise((r) => setTimeout(r, 250));
    const newRule: DiscountRuleConfig = {
      ...payload,
      id: `rule_${Date.now()}`,
    };
    mockDiscountRulesState = [newRule, ...mockDiscountRulesState];
    return newRule;
  },

  async updateDiscountRule(id: string, updates: Partial<DiscountRuleConfig>): Promise<DiscountRuleConfig> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockDiscountRulesState.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Discount rule with id ${id} not found`);

    const updated = { ...mockDiscountRulesState[idx], ...updates };
    mockDiscountRulesState[idx] = updated;
    return updated;
  },

  async deleteDiscountRule(id: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 150));
    mockDiscountRulesState = mockDiscountRulesState.filter((r) => r.id !== id);
    return true;
  },
};
