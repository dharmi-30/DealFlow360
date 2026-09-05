'use client';

import * as React from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Percent,
  Award,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Select,
  Button,
  Badge,
  useToast,
  Dropdown,
} from '@/components/ui';
import {
  MOCK_REPORT_KPIS,
  MOCK_SALES_TREND_CHART,
  MOCK_PIPELINE_CHART,
  MOCK_APPROVAL_PERFORMANCE_CHART,
  MOCK_CATEGORY_PERFORMANCE_CHART,
  MOCK_DISCOUNT_ANALYSIS_CHART,
  MOCK_TOP_PRODUCTS,
  MOCK_TOP_CUSTOMERS,
} from '@/data/mockReportsData';
import type { PeriodOption } from '@/types/reports';
import { formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const toast = useToast();

  // Filter Bar state
  const [period, setPeriod] = React.useState<PeriodOption>('this_quarter');
  const [salesRep, setSalesRep] = React.useState('all');
  const [approvalStatus, setApprovalStatus] = React.useState('all');
  const [category, setCategory] = React.useState('all');

  // State for active filters vs applied filters
  const [isFiltered, setIsFiltered] = React.useState(false);

  const handleApplyFilters = () => {
    setIsFiltered(true);
    toast.success(
      'Filters Applied',
      `Analytics updated for period '${period.replace('_', ' ')}' and selected parameters.`
    );
  };

  const handleResetFilters = () => {
    setPeriod('this_quarter');
    setSalesRep('all');
    setApprovalStatus('all');
    setCategory('all');
    setIsFiltered(false);
    toast.info('Filters Reset', 'Reports reset to default quarterly parameters.');
  };

  const handleExport = (format: string) => {
    toast.success(
      'Report Exported',
      `Executive Analytics report exported as ${format.toUpperCase()} file.`
    );
  };

  return (
    <AppShell title="Executive Reports" subtitle="Revenue Trends, Deal Conversions & Operational Metrics">
      <PageHeader
        title="Executive Sales & Performance Analytics"
        subtitle="Comprehensive reporting on revenue velocity, margin health, discount controls & customer win rates"
        actions={
          <div className="flex items-center gap-2">
            <Dropdown
              trigger={
                <Button variant="primary" size="sm" className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  <span>Export Report</span>
                </Button>
              }
              items={[
                {
                  id: 'csv',
                  label: 'Export CSV Data (.csv)',
                  icon: FileSpreadsheet,
                  onClick: () => handleExport('CSV'),
                },
                {
                  id: 'excel',
                  label: 'Export Excel Workbook (.xlsx)',
                  icon: FileSpreadsheet,
                  onClick: () => handleExport('Excel'),
                },
                {
                  id: 'pdf',
                  label: 'Export Executive PDF (.pdf)',
                  icon: FileText,
                  onClick: () => handleExport('PDF'),
                },
              ]}
            />
          </div>
        }
      />

      <div className="space-y-6">
        {/* TOP FILTER BAR */}
        <GlassCard className="p-4 space-y-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Analytics Control Panel & Filters
              </h3>
            </div>
            {isFiltered && (
              <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded font-mono">
                Active Filter Applied
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            {/* Period Selector */}
            <div>
              <Select
                label="Reporting Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                options={[
                  { value: 'today', label: 'Today' },
                  { value: 'this_week', label: 'This Week' },
                  { value: 'this_month', label: 'This Month' },
                  { value: 'this_quarter', label: 'This Quarter' },
                  { value: 'custom', label: 'Custom Date Range' },
                ]}
              />
            </div>

            {/* Sales Team / Rep Selector */}
            <div>
              <Select
                label="Sales Team / Rep"
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                options={[
                  { value: 'all', label: 'All Representatives' },
                  { value: 'sarah_chen', label: 'Sarah Chen' },
                  { value: 'alex_rivera', label: 'Alex Rivera' },
                  { value: 'michael_scott', label: 'Michael Scott' },
                ]}
              />
            </div>

            {/* Approval Status Selector */}
            <div>
              <Select
                label="Approval Status"
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending Approval' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>

            {/* Product / Category Selector */}
            <div>
              <Select
                label="Product Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={[
                  { value: 'all', label: 'All Categories' },
                  { value: 'Hardware', label: 'Hardware' },
                  { value: 'Services', label: 'Services' },
                  { value: 'Subscriptions', label: 'Subscriptions' },
                  { value: 'Robotics', label: 'Robotics' },
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>

            <Button variant="primary" size="sm" onClick={handleApplyFilters} className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Apply Filters
            </Button>
          </div>
        </GlassCard>

        {/* REPORT CARDS (KPI OVERVIEW) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Sales</span>
            <div className="text-lg font-extrabold text-cyan-400 font-mono">
              {formatCurrency(MOCK_REPORT_KPIS.totalSales)}
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +14.2% YoY Growth
            </span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Quote Value</span>
            <div className="text-lg font-extrabold text-slate-100 font-mono">
              {formatCurrency(MOCK_REPORT_KPIS.quoteValue)}
            </div>
            <span className="text-[10px] text-slate-500">Issued proposals</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Discount Given</span>
            <div className="text-lg font-extrabold text-amber-400 font-mono">
              {formatCurrency(MOCK_REPORT_KPIS.discountGiven)}
            </div>
            <span className="text-[10px] text-amber-300">12.4% Blended Avg</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Average Margin</span>
            <div className="text-lg font-extrabold text-emerald-400 font-mono">
              {MOCK_REPORT_KPIS.averageMargin}%
            </div>
            <span className="text-[10px] text-slate-500">Above target floor</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Approval Rate</span>
            <div className="text-lg font-extrabold text-violet-400 font-mono">
              {MOCK_REPORT_KPIS.approvalRate}%
            </div>
            <span className="text-[10px] text-slate-500">Manager sign-offs</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Win Rate</span>
            <div className="text-lg font-extrabold text-cyan-300 font-mono">
              {MOCK_REPORT_KPIS.winRate}%
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +3.8% vs last Q
            </span>
          </GlassCard>
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CHART 1: SALES TREND (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-5 space-y-4 border-l-4 border-l-cyan-500">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Sales Trend vs Target (6 Months)
                  </h3>
                  <p className="text-[10px] text-slate-400">Closed revenue vs quota target</p>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_SALES_TREND_CHART}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val || 0))}
                      contentStyle={{
                        backgroundColor: '#090e1a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Actual Revenue ($)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#salesGrad)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      name="Target Quota ($)"
                      stroke="#a855f7"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          {/* CHART 2: QUOTE PIPELINE (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Quote Pipeline by Stage ($)
                </h3>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_PIPELINE_CHART}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="stage" stroke="#64748b" fontSize={10} interval={0} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val || 0))}
                      contentStyle={{
                        backgroundColor: '#090e1a',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" name="Pipeline Value ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* CHARTS ROW 2: APPROVAL, CATEGORY & DISCOUNT ANALYSIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* CHART 3: APPROVAL PERFORMANCE */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Approval Queue Breakdown
              </h3>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_APPROVAL_PERFORMANCE_CHART} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={10} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090e1a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" name="Quotations" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* CHART 4: PRODUCT / CATEGORY PERFORMANCE */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Revenue by Product Category
              </h3>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_CATEGORY_PERFORMANCE_CHART}>
                  <XAxis dataKey="category" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val || 0))}
                    contentStyle={{
                      backgroundColor: '#090e1a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* CHART 5: DISCOUNT VS MARGIN ANALYSIS */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Discount Range vs Margin %
              </h3>
            </div>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_DISCOUNT_ANALYSIS_CHART}>
                  <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                  <YAxis domain={[10, 50]} stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: any) => `${val}%`}
                    contentStyle={{
                      backgroundColor: '#090e1a',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="margin"
                    name="Gross Margin %"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ fill: '#f59e0b', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </div>

        {/* TABLES SECTION: TOP PRODUCTS & TOP CUSTOMERS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* TOP PRODUCTS TABLE */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top Performing Products
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-center">Avg Disc</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {MOCK_TOP_PRODUCTS.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-slate-100">{prod.productName}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {prod.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">{prod.unitsSold}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-cyan-400 font-mono">
                        {formatCurrency(prod.revenue)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {prod.avgDiscount > 0 ? `-${prod.avgDiscount}%` : '0%'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                        {prod.margin}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* TOP CUSTOMERS TABLE */}
          <GlassCard className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Top Revenue Accounts & Customers
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="py-2.5 px-3">Customer Account</th>
                    <th className="py-2.5 px-3 text-center">Quotes</th>
                    <th className="py-2.5 px-3 text-right">Won Value</th>
                    <th className="py-2.5 px-3 text-center">Avg Disc</th>
                    <th className="py-2.5 px-3 text-right">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {MOCK_TOP_CUSTOMERS.map((cust) => (
                    <tr key={cust.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-slate-100">{cust.customerName}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-200">{cust.quotesCount}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-cyan-400 font-mono">
                        {formatCurrency(cust.wonValue)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-400 font-semibold">
                        -{cust.avgDiscount}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400 font-mono">
                        {cust.margin}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
