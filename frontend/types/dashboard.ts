import type { ID, ISODateString, QuotationStatus, RiskLevel } from './index';

export type TimePeriod = 'today' | 'this_week' | 'this_month' | 'this_quarter';

export interface DashboardKPI {
  id: string;
  label: string;
  value: string | number;
  isCurrency?: boolean;
  change: number; // e.g. +14.2 or -3.1
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  iconName: string;
  accentColor: 'cyan' | 'violet' | 'emerald' | 'amber' | 'danger';
}

export interface RevenueChartPoint {
  period: string;
  revenue: number;
  quotations: number;
  target: number;
}

export interface PipelineStageSummary {
  id: string;
  stage: QuotationStatus;
  label: string;
  count: number;
  value: number;
  color: string;
}

export interface ApprovalAttentionItem {
  id: ID;
  quoteNumber: string;
  customerName: string;
  discountPercentage: number;
  totalValue: number;
  riskLevel: RiskLevel;
  waitingSince: string;
  requestedBy: string;
}

export interface DealHealthSummary {
  stalledDealsCount: number;
  stalledDealsValue: number;
  discountAnomaliesCount: number;
  discountAnomaliesValue: number;
  deliveryRiskCount: number;
  deliveryRiskValue: number;
}

export interface ActivityFeedItem {
  id: ID;
  type: 'quote_created' | 'approval_requested' | 'quote_approved' | 'warehouse_updated' | 'negotiation_received' | 'payment_recorded';
  title: string;
  description: string;
  timestamp: string;
  userName: string;
  userAvatar?: string;
}

export interface DashboardData {
  kpis: DashboardKPI[];
  chartData: Record<TimePeriod, RevenueChartPoint[]>;
  pipelineStages: PipelineStageSummary[];
  approvalQueue: ApprovalAttentionItem[];
  healthSummary: DealHealthSummary;
  activityFeed: ActivityFeedItem[];
}
