/**
 * Reports Service Abstraction
 * Encapsulates sales analytics, revenue trend aggregation, and export handlers.
 * Designed for seamless swap with FastAPI REST endpoints (/api/v1/reports).
 */

import {
  MOCK_REPORT_KPIS,
  MOCK_TOP_PRODUCTS,
  MOCK_TOP_CUSTOMERS,
  MOCK_SALES_TREND_CHART,
  MOCK_PIPELINE_CHART,
  MOCK_APPROVAL_PERFORMANCE_CHART,
  MOCK_CATEGORY_PERFORMANCE_CHART,
  MOCK_DISCOUNT_ANALYSIS_CHART,
} from '@/data/mockReportsData';

import type {
  ReportFilterState,
  ReportKpiMetrics,
  TopProductReport,
  TopCustomerReport,
} from '@/types';

export const reportsService = {
  async getMetrics(filters: ReportFilterState): Promise<ReportKpiMetrics> {
    await new Promise((r) => setTimeout(r, 150));
    let multiplier = 1.0;
    if (filters.period === 'today') multiplier = 0.2;
    if (filters.period === 'this_week') multiplier = 0.5;
    if (filters.period === 'this_quarter') multiplier = 1.8;

    return {
      totalSales: Math.round(MOCK_REPORT_KPIS.totalSales * multiplier),
      quoteValue: Math.round(MOCK_REPORT_KPIS.quoteValue * multiplier),
      discountGiven: Math.round(MOCK_REPORT_KPIS.discountGiven * multiplier),
      averageMargin: MOCK_REPORT_KPIS.averageMargin,
      approvalRate: MOCK_REPORT_KPIS.approvalRate,
      winRate: MOCK_REPORT_KPIS.winRate,
    };
  },

  async getTopProducts(filters: ReportFilterState): Promise<TopProductReport[]> {
    await new Promise((r) => setTimeout(r, 150));
    if (filters.category === 'All' || !filters.category) return MOCK_TOP_PRODUCTS;
    return MOCK_TOP_PRODUCTS.filter((p) => p.category === filters.category);
  },

  async getTopCustomers(filters: ReportFilterState): Promise<TopCustomerReport[]> {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_TOP_CUSTOMERS;
  },

  async getChartData(chartType: string, filters: ReportFilterState): Promise<any[]> {
    await new Promise((r) => setTimeout(r, 100));
    switch (chartType) {
      case 'sales_trend':
        return MOCK_SALES_TREND_CHART;
      case 'pipeline':
        return MOCK_PIPELINE_CHART;
      case 'approval_performance':
        return MOCK_APPROVAL_PERFORMANCE_CHART;
      case 'category_performance':
        return MOCK_CATEGORY_PERFORMANCE_CHART;
      case 'discount_margin':
        return MOCK_DISCOUNT_ANALYSIS_CHART;
      default:
        return MOCK_SALES_TREND_CHART;
    }
  },

  async exportReport(
    format: 'pdf' | 'csv' | 'excel',
    filters: ReportFilterState
  ): Promise<{ downloadUrl: string; filename: string }> {
    await new Promise((r) => setTimeout(r, 400));
    const timestamp = new Date().toISOString().split('T')[0];
    return {
      downloadUrl: '#',
      filename: `dealflow_report_${filters.period}_${timestamp}.${format}`,
    };
  },
};
