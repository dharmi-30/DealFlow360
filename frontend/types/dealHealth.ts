export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AlertType = 'stalled_deal' | 'discount_anomaly' | 'delivery_promise_risk';

export interface DealHealthAlert {
  id: string;
  type: AlertType;
  typeLabel: string;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  salesRep: string;
  severity: AlertSeverity;
  description: string;
  detectedTime: string;
  recommendedAction: string;
  dealValue: number;
}

export interface ContributingFactor {
  name: string;
  key: 'approvalDelay' | 'discountDeviation' | 'customerInactivity' | 'deliveryRisk' | 'marginRisk';
  score: number; // 0 - 100 score where higher = healthier / lower risk
  impact: 'low' | 'medium' | 'high' | 'critical';
  detail: string;
}

export interface DealHealthOverview {
  overallScore: number;
  healthyDealsCount: number;
  atRiskCount: number;
  stalledCount: number;
  discountAnomaliesCount: number;
  deliveryRiskCount: number;
  contributingFactors: ContributingFactor[];
  historicalTrend: { period: string; score: number; atRiskDeals: number }[];
}
