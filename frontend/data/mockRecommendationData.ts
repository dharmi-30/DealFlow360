import type { RecommendationItem } from '@/types/recommendations';
import { MOCK_PRODUCTS } from './mockProductsData';

export const MOCK_RECOMMENDATIONS: RecommendationItem[] = [
  {
    id: 'rec_101',
    rank: 1,
    suggestedProduct: MOCK_PRODUCTS[2], // 24/7 Priority SLA Support Tier
    reason: 'frequently_bought_together',
    reasonLabel: 'Frequently purchased together',
    explanation:
      '84% of Enterprise SaaS License buyers attach 24/7 Priority SLA Support within 30 days of contract signature.',
    marginDelta: 4.2,
    promotion: 'PROMO-ATTACH20 (20% Off SLA)',
    confidence: 96,
    stock: MOCK_PRODUCTS[2].stockAvailability,
  },
  {
    id: 'rec_102',
    rank: 2,
    suggestedProduct: MOCK_PRODUCTS[4], // Dedicated Security Firewall Module
    reason: 'customer_tier_popular',
    reasonLabel: 'Popular with this customer tier',
    explanation:
      'Gold Tier Enterprise accounts in tech & defense average 2.4 Firewall Modules per cloud deployment.',
    marginDelta: 3.8,
    promotion: 'BUNDLE-SECURE-Q4',
    confidence: 91,
    stock: MOCK_PRODUCTS[4].stockAvailability,
  },
  {
    id: 'rec_103',
    rank: 3,
    suggestedProduct: MOCK_PRODUCTS[6], // Telemetry Calibration Suite
    reason: 'high_margin_addon',
    reasonLabel: 'High-margin add-on',
    explanation:
      'Adding Telemetry Calibration Suite expands total contract ARR while boasting a 54.5% gross margin contribution.',
    marginDelta: 5.5,
    confidence: 88,
    stock: MOCK_PRODUCTS[6].stockAvailability,
  },
  {
    id: 'rec_104',
    rank: 4,
    suggestedProduct: MOCK_PRODUCTS[3], // Cloud Infrastructure Node Unit
    reason: 'active_promotion',
    reasonLabel: 'Active promotion',
    explanation:
      'Active Q4 Hardware Expansion Promo provides instantaneous bundle rebate when paired with software subscriptions.',
    marginDelta: 2.1,
    promotion: 'Q4-HW-EXPANSION',
    confidence: 82,
    stock: MOCK_PRODUCTS[3].stockAvailability,
  },
];
