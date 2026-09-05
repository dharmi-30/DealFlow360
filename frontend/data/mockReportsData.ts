import type {
  ReportKpiMetrics,
  TopProductReport,
  TopCustomerReport,
} from '@/types/reports';

export const MOCK_REPORT_KPIS: ReportKpiMetrics = {
  totalSales: 1420000,
  quoteValue: 2150000,
  discountGiven: 184500,
  averageMargin: 36.8,
  approvalRate: 92.5,
  winRate: 64.2,
};

export const MOCK_SALES_TREND_CHART = [
  { month: 'Jan', revenue: 180000, target: 160000 },
  { month: 'Feb', revenue: 210000, target: 180000 },
  { month: 'Mar', revenue: 260000, target: 220000 },
  { month: 'Apr', revenue: 240000, target: 230000 },
  { month: 'May', revenue: 290000, target: 250000 },
  { month: 'Jun', revenue: 340000, target: 280000 },
];

export const MOCK_PIPELINE_CHART = [
  { stage: 'Draft', value: 185000, count: 4 },
  { stage: 'Pending Approval', value: 340000, count: 3 },
  { stage: 'Negotiation', value: 520000, count: 5 },
  { stage: 'Approved', value: 450000, count: 6 },
  { stage: 'Confirmed', value: 650000, count: 8 },
];

export const MOCK_APPROVAL_PERFORMANCE_CHART = [
  { status: 'Approved', count: 42, color: '#10b981' },
  { status: 'Pending Review', count: 8, color: '#f59e0b' },
  { status: 'Revision Requested', count: 5, color: '#8b5cf6' },
  { status: 'Rejected', count: 3, color: '#ef4444' },
];

export const MOCK_CATEGORY_PERFORMANCE_CHART = [
  { category: 'Hardware', revenue: 680000, percentage: 33 },
  { category: 'Robotics', revenue: 617500, percentage: 30 },
  { category: 'Subscriptions', revenue: 420000, percentage: 20 },
  { category: 'Services', revenue: 340000, percentage: 17 },
];

export const MOCK_DISCOUNT_ANALYSIS_CHART = [
  { range: '0-5% Disc', margin: 44.5, count: 12 },
  { range: '5-10% Disc', margin: 38.2, count: 18 },
  { range: '10-15% Disc', margin: 32.4, count: 10 },
  { range: '15-20% Disc', margin: 26.1, count: 5 },
  { range: '>20% Disc', margin: 18.5, count: 2 },
];

export const MOCK_TOP_PRODUCTS: TopProductReport[] = [
  {
    id: 'tprod_01',
    productName: 'Automated Sorting Robotics Unit',
    category: 'Robotics',
    unitsSold: 10,
    revenue: 617500,
    avgDiscount: 5.0,
    margin: 41.5,
  },
  {
    id: 'tprod_02',
    productName: 'Enterprise SaaS Annual License',
    category: 'Subscriptions',
    unitsSold: 100,
    revenue: 85500,
    avgDiscount: 10.0,
    margin: 55.8,
  },
  {
    id: 'tprod_03',
    productName: 'Avionics Data Processor Unit',
    category: 'Hardware',
    unitsSold: 200,
    revenue: 271800,
    avgDiscount: 24.5,
    margin: 18.2,
  },
  {
    id: 'tprod_04',
    productName: 'Cloud Infrastructure Node Unit',
    category: 'Hardware',
    unitsSold: 50,
    revenue: 65200,
    avgDiscount: 18.5,
    margin: 22.4,
  },
  {
    id: 'tprod_05',
    productName: 'Telemetry Calibration Suite',
    category: 'Subscriptions',
    unitsSold: 2,
    revenue: 136400,
    avgDiscount: 0.0,
    margin: 54.5,
  },
];

export const MOCK_TOP_CUSTOMERS: TopCustomerReport[] = [
  {
    id: 'tcust_01',
    customerName: 'Soylent Corp Logistics',
    quotesCount: 4,
    wonValue: 650000,
    avgDiscount: 5.0,
    margin: 42.0,
  },
  {
    id: 'tcust_02',
    customerName: 'BioPharm Dynamics Inc.',
    quotesCount: 3,
    wonValue: 520000,
    avgDiscount: 28.0,
    margin: 15.4,
  },
  {
    id: 'tcust_03',
    customerName: 'AeroSpace Global Corp',
    quotesCount: 5,
    wonValue: 340000,
    avgDiscount: 24.5,
    margin: 18.2,
  },
  {
    id: 'tcust_04',
    customerName: 'Acme Enterprises Inc.',
    quotesCount: 6,
    wonValue: 124000,
    avgDiscount: 12.0,
    margin: 38.5,
  },
  {
    id: 'tcust_05',
    customerName: 'Globex Tech Systems LLC',
    quotesCount: 2,
    wonValue: 89500,
    avgDiscount: 18.5,
    margin: 22.4,
  },
];
