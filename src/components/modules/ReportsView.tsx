import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Layers,
  Sparkles,
  Calendar,
  Users,
  CheckCircle2,
  Package,
  FileText,
} from 'lucide-react';

import { Quotation, ApprovalRecord, Product } from '../../types';

interface ReportsViewProps {
  quotations?: Quotation[];
  approvals?: ApprovalRecord[];
  products?: Product[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  quotations = [],
  approvals = [],
  products = [],
}) => {
  // Filter state
  const [period, setPeriod] = useState<string>('This Month');
  const [salesTeam, setSalesTeam] = useState<string>('All Teams');
  const [approvalStatus, setApprovalStatus] = useState<string>('All');
  const [productFilter, setProductFilter] = useState<string>('All Products');

  const quotesCount = quotations.length;
  const topProduct = products.find((p) => p.category.includes('Subscription'))?.name || 'Care Plan 2yr';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Commercial Analytics & Reporting</h1>
          <p className="page-subheading">
            Lightweight operational reporting on quote velocity, approval times, and upsell performance.
          </p>
        </div>

        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#38d9ff',
            backgroundColor: 'rgba(56,217,255,0.08)',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(56,217,255,0.2)',
          }}
        >
          Active Reporting Period: <strong className="font-mono">{period}</strong>
        </div>
      </div>

      {/* REPORTING FILTERS TOOLBAR */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        {/* Filter 1: Period */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
            Period
          </label>
          <select
            className="input-glass-select"
            style={{ width: '100%', fontSize: '12px' }}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="This Month">This Month (Sep 2026)</option>
            <option value="This Quarter">This Quarter (Q3 2026)</option>
            <option value="YTD">Year to Date (YTD)</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>

        {/* Filter 2: Sales Team */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
            Sales Team
          </label>
          <select
            className="input-glass-select"
            style={{ width: '100%', fontSize: '12px' }}
            value={salesTeam}
            onChange={(e) => setSalesTeam(e.target.value)}
          >
            <option value="All Teams">All Sales Teams</option>
            <option value="Enterprise Sales">Enterprise Sales</option>
            <option value="Mid-Market">Mid-Market</option>
            <option value="Strategic Accounts">Strategic Accounts</option>
          </select>
        </div>

        {/* Filter 3: Approval Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
            Approval Status
          </label>
          <select
            className="input-glass-select"
            style={{ width: '100%', fontSize: '12px' }}
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Approval</option>
            <option value="Returned">Returned for Revision</option>
          </select>
        </div>

        {/* Filter 4: Product */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
            Product
          </label>
          <select
            className="input-glass-select"
            style={{ width: '100%', fontSize: '12px' }}
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
          >
            <option value="All Products">All Products</option>
            <option value="Hardware">Laptop Pro 14 (Hardware)</option>
            <option value="Services">Onsite Setup Service</option>
            <option value="Software Subscription">Care Plan 2yr (SaaS)</option>
            <option value="Support">Support SLA</option>
          </select>
        </div>
      </div>

      {/* TOP THREE SUMMARY METRICS */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {/* Metric 1: Quotes Created */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Quotes Created</span>
            <FileText size={16} style={{ color: '#2f8cff' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#2f8cff' }}>
            {quotesCount} Quotes
          </div>
          <div className="kpi-sub-label">Total proposals parsed from schema.sql</div>
        </div>

        {/* Metric 2: Average Approval Time */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Average Approval Time</span>
            <Clock size={16} style={{ color: '#31d38a' }} />
          </div>
          <div className="kpi-main-val font-mono" style={{ color: '#31d38a' }}>
            4.2 Hours
          </div>
          <div className="kpi-sub-label">Governance turnaround SLA average</div>
        </div>

        {/* Metric 3: Top Upsold Product */}
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Top Upsold Product</span>
            <Sparkles size={16} style={{ color: '#38d9ff' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#38d9ff', fontSize: '18px', fontWeight: 800 }}>
            {topProduct}
          </div>
          <div className="kpi-sub-label">Attached on enterprise hardware quotes</div>
        </div>
      </div>

      {/* OPERATIONAL CHARTS / ANALYTICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Discount vs Win Rate Correlation */}
        <div className="glass-panel" style={{ marginBottom: 0, padding: '20px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#f5f7fa',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <TrendingUp size={18} style={{ color: '#38d9ff' }} /> Discount vs. Win-Rate Correlation
          </h3>
          <p style={{ fontSize: '12px', color: '#9aa8ba', marginBottom: '16px' }}>
            Historical win rate plotted against representative discount percentages.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#9aa8ba' }}>0.0% - 5.0% Discount (Bronze)</span>
                <strong className="font-mono" style={{ color: '#31d38a' }}>
                  72.4% Win Rate
                </strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '72.4%', height: '100%', background: '#31d38a' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#9aa8ba' }}>5.1% - 15.0% Discount (Gold Limit)</span>
                <strong className="font-mono" style={{ color: '#2f8cff' }}>
                  84.1% Win Rate (Optimal Zone)
                </strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '84.1%', height: '100%', background: '#2f8cff' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: '#9aa8ba' }}>15.1% - 25.0% Discount (High Risk)</span>
                <strong className="font-mono" style={{ color: '#f5b544' }}>
                  61.0% Win Rate (Margin Erosion)
                </strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '61.0%', height: '100%', background: '#f5b544' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Approval Velocity SLA Breakdown */}
        <div className="glass-panel" style={{ marginBottom: 0, padding: '20px' }}>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#f5f7fa',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={18} style={{ color: '#31d38a' }} /> Approval SLA Bottleneck Analysis
          </h3>
          <p style={{ fontSize: '12px', color: '#9aa8ba', marginBottom: '16px' }}>
            Average turnaround time across governance approval tiers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', color: '#f5f7fa' }}>Sales Manager Approval</strong>
                <div style={{ fontSize: '11px', color: '#9aa8ba' }}>Tier limit: 10% - 15% discount</div>
              </div>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: '#31d38a' }}>
                2.8 hrs avg
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div>
                <strong style={{ fontSize: '13px', color: '#f5f7fa' }}>Finance Controller Review</strong>
                <div style={{ fontSize: '11px', color: '#9aa8ba' }}>High risk &gt; 15% discount</div>
              </div>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: '#f5b544' }}>
                6.5 hrs avg
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

