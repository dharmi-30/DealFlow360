'use client';

import * as React from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader, GlassCard, useToast } from '@/components/ui';
import { UpsellPanel } from '@/components/ui/UpsellPanel';
import type { ProductItem } from '@/types';
import { calculateQuotationSummary, type CartLineItem } from '@/lib/quotationCalculator';
import { MOCK_PRODUCTS } from '@/data/mockProductsData';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpsellPage() {
  const toast = useToast();
  const [cartLines, setCartLines] = React.useState<CartLineItem[]>([
    {
      id: 'line_init_1',
      product: MOCK_PRODUCTS[0],
      quantity: 5,
      unitPrice: MOCK_PRODUCTS[0].unitPrice,
      discountPercentage: 10,
      taxRate: 0.10,
    },
  ]);

  const summary = React.useMemo(() => {
    return calculateQuotationSummary(cartLines);
  }, [cartLines]);

  const handleAddProduct = (product: ProductItem) => {
    setCartLines((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: `line_${Date.now()}`,
          product,
          quantity: 1,
          unitPrice: product.unitPrice,
          discountPercentage: 10,
          taxRate: 0.10,
        },
      ];
    });
    toast.success('Recommendation Added', `${product.name} appended to quotation builder cart`);
  };

  return (
    <AppShell title="Deal Recommendations" subtitle="AI & Telemetry Upsell / Cross-Sell Engine">
      <PageHeader
        title="Recommended for this deal"
        subtitle="Automated product attach rate, customer tier analytics & gross margin optimization recommendations"
      />

      <div className="space-y-6">
        {/* TOP STATUS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Cart Total</span>
            <div className="text-lg font-extrabold text-cyan-400">{formatCurrency(summary.grandTotal)}</div>
            <span className="text-[10px] text-slate-500">{cartLines.length} active items</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Margin</span>
            <div className="text-lg font-extrabold text-emerald-400">
              {summary.grossMarginPercentage.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">
              {summary.marginHealth === 'Healthy' ? 'Above target margin' : 'Requires optimization'}
            </span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Margin ($)</span>
            <div className="text-lg font-extrabold text-slate-100 font-mono">
              {formatCurrency(summary.grossMarginAmount)}
            </div>
            <span className="text-[10px] text-slate-500">Est. cost: {formatCurrency(summary.totalCost)}</span>
          </GlassCard>

          <GlassCard className="p-4 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Approval Requirement</span>
            <div className="text-xs font-bold text-slate-200 mt-1">
              {summary.requiresApproval ? (
                <span className="text-amber-400 flex items-center gap-1">
                  Manager Review Required
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Auto-Approve Eligible
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500">Based on discount rules</span>
          </GlassCard>
        </div>

        {/* MAIN REUSABLE UPSELL PANEL */}
        <UpsellPanel onAddProduct={handleAddProduct} layout="bottom" />
      </div>
    </AppShell>
  );
}
