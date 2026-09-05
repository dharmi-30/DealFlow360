export type PeriodOption = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'custom';

export interface ReportFilterState {
  period: PeriodOption;
  salesRep: string;
  approvalStatus: string;
  category: string;
}

export interface ReportKpiMetrics {
  totalSales: number;
  quoteValue: number;
  discountGiven: number;
  averageMargin: number;
  approvalRate: number;
  winRate: number;
}

export interface TopProductReport {
  id: string;
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
  avgDiscount: number;
  margin: number;
}

export interface TopCustomerReport {
  id: string;
  customerName: string;
  quotesCount: number;
  wonValue: number;
  avgDiscount: number;
  margin: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  category?: string;
}
