import type { ProductItem } from './products';

export type RecommendationReasonType =
  | 'frequently_bought_together'
  | 'customer_tier_popular'
  | 'active_promotion'
  | 'high_margin_addon';

export interface RecommendationItem {
  id: string;
  rank?: number;
  suggestedProduct: ProductItem;
  reason: RecommendationReasonType;
  reasonLabel: string;
  explanation: string;
  marginDelta: number; // e.g. +4.2 for +4.2% gross margin boost
  promotion?: string; // e.g. "PROMO-Q4" or "20% Off SLA"
  confidence: number; // 0 - 100 percentage match
  stock: number;
}

/**
 * FastAPI Response model compatibility wrapper:
 * For future integration when FastAPI returns:
 * {
 *   suggested_product: ProductItem,
 *   reason: string,
 *   margin_delta: number,
 *   promotion?: string,
 *   confidence: number
 * }
 */
export interface FastApiRecommendationResponse {
  id?: string;
  suggested_product: ProductItem;
  reason: string;
  reason_label?: string;
  explanation?: string;
  margin_delta: number;
  promotion?: string;
  confidence: number;
  stock?: number;
}
