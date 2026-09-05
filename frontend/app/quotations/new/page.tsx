'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  Building2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Save,
  Send,
  ArrowLeft,
  RefreshCw,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Input,
  Button,
  IconButton,
  Badge,
  Modal,
  ProgressBar,
  useToast,
  UpsellPanel,
} from '@/components/ui';
import { MOCK_PRODUCTS } from '@/data/mockProductsData';
import { MOCK_CUSTOMERS } from '@/data/mockCustomersData';
import type { ProductItem, CustomerAccount } from '@/types';
import {
  calculateQuotationSummary,
  type CartLineItem,
} from '@/lib/quotationCalculator';
import { formatCurrency } from '@/lib/utils';

export default function QuotationBuilderPage() {
  const router = useRouter();
  const toast = useToast();

  // Selected customer state
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>(MOCK_CUSTOMERS[0].id);
  const selectedCustomer = MOCK_CUSTOMERS.find((c) => c.id === selectedCustomerId) || MOCK_CUSTOMERS[0];

  // Product search & category state
  const [productSearch, setProductSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  // Quote line items cart state
  const [cartLines, setCartLines] = React.useState<CartLineItem[]>([
    {
      id: 'line_01',
      product: MOCK_PRODUCTS[0],
      quantity: 10,
      unitPrice: MOCK_PRODUCTS[0].unitPrice,
      discountPercentage: MOCK_CUSTOMERS[0].defaultDiscount,
      taxRate: 0.10,
    },
    {
      id: 'line_02',
      product: MOCK_PRODUCTS[1],
      quantity: 1,
      unitPrice: MOCK_PRODUCTS[1].unitPrice,
      discountPercentage: 5.0,
      taxRate: 0.10,
    },
  ]);

  // Preview modal state
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  // Live Calculations
  const summary = React.useMemo(() => {
    return calculateQuotationSummary(cartLines);
  }, [cartLines]);

  // Filtered product catalog
  const filteredProducts = React.useMemo(() => {
    return MOCK_PRODUCTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productSearch, categoryFilter]);

  // Cart operations
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
          id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          product,
          quantity: 1,
          unitPrice: product.unitPrice,
          discountPercentage: selectedCustomer.defaultDiscount,
          taxRate: 0.10,
        },
      ];
    });
    toast.success('Added to Quote', `${product.name} added`);
  };

  const handleUpdateQuantity = (lineId: string, newQty: number) => {
    if (newQty < 1) return;
    setCartLines((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleUpdateDiscount = (lineId: string, newDisc: number) => {
    const clamped = Math.min(100, Math.max(0, newDisc));
    setCartLines((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, discountPercentage: clamped } : item))
    );
  };

  const handleUpdateUnitPrice = (lineId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCartLines((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, unitPrice: newPrice } : item))
    );
  };

  const handleRemoveLine = (lineId: string) => {
    setCartLines((prev) => prev.filter((item) => item.id !== lineId));
    toast.info('Item Removed', 'Line item removed from quotation');
  };

  const handleSaveDraft = () => {
    toast.success('Draft Saved', 'Quotation draft saved to sales workspace');
    router.push('/quotations');
  };

  const handleSubmitProposal = () => {
    if (summary.requiresApproval) {
      toast.warning('Approval Required', summary.approvalReason || 'Submitted to manager approval queue');
    } else {
      toast.success('Quotation Confirmed', 'Proposal confirmed without requiring approval');
    }
    router.push('/quotations');
  };

  return (
    <AppShell title="Quotation Builder" subtitle="Central Sales Operations Proposal Workspace">
      <PageHeader
        title="Commercial Proposal Builder"
        subtitle="Build multi-line B2B quotations, configure margins & enforce discount policy safeguards"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/quotations')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Proposal</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft}>
              <Save className="h-3.5 w-3.5" />
              <span>Save Draft</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitProposal}
              disabled={cartLines.length === 0}
            >
              <Send className="h-3.5 w-3.5" />
              <span>{summary.requiresApproval ? 'Submit for Approval' : 'Confirm Order'}</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* TOP: CUSTOMER SELECTION BAR */}
        <GlassCard className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 border-l-cyan-500">
          <div className="flex flex-1 flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <div className="w-full sm:w-72">
              <Select
                label="Select Account / Customer"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={MOCK_CUSTOMERS.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.tier} Tier)`,
                }))}
              />
            </div>

            {/* Customer Tier Indicator */}
            <div className="flex items-center gap-3 pt-4 sm:pt-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  Customer Tier
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                    selectedCustomer.tier === 'Gold'
                      ? 'bg-amber-500/10 text-amber-400 ring-amber-500/30'
                      : selectedCustomer.tier === 'Silver'
                      ? 'bg-slate-300/10 text-slate-300 ring-slate-400/30'
                      : 'bg-orange-500/10 text-orange-400 ring-orange-500/30'
                  }`}
                >
                  ★ {selectedCustomer.tier} Tier ({selectedCustomer.defaultDiscount}% Default Disc)
                </span>
              </div>
            </div>
          </div>

          {/* Customer Metadata */}
          <div className="flex items-center gap-6 text-xs text-slate-400 shrink-0">
            <div>
              <span className="text-slate-500">Contact:</span>
              <p className="font-semibold text-slate-200">{selectedCustomer.contactPerson}</p>
            </div>
            <div>
              <span className="text-slate-500">Email:</span>
              <p className="font-semibold text-slate-200">{selectedCustomer.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Credit Limit:</span>
              <p className="font-semibold text-slate-200">{formatCurrency(selectedCustomer.creditLimit)}</p>
            </div>
          </div>
        </GlassCard>

        {/* MAIN 3-COLUMN DESKTOP WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: PRODUCT SELECTION (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Product Catalog</h3>
              
              <SearchInput
                value={productSearch}
                onChange={setProductSearch}
                placeholder="Search products, SKUs..."
              />

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {['all', 'Hardware', 'Services', 'Subscriptions'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all shrink-0 select-none ${
                      categoryFilter === cat
                        ? 'bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              {/* Products List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.12] transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 leading-tight">
                          {product.name}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-400">{product.sku}</span>
                      </div>
                      {product.isSubscription && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded border border-violet-500/20 shrink-0">
                          <RefreshCw className="h-2.5 w-2.5" />
                          Recurring
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-100">
                          {formatCurrency(product.unitPrice)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({product.stockAvailability} avail)
                        </span>
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => handleAddProduct(product)}>
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* CENTER COLUMN: QUOTE LINES (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-4 space-y-4 min-h-[550px]">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Quote Line Items ({cartLines.length})
                </h3>
                {cartLines.length > 0 && (
                  <button
                    onClick={() => setCartLines([])}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {cartLines.length === 0 ? (
                <div className="flex min-h-[350px] flex-col items-center justify-center text-center p-8 space-y-3 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-slate-500">
                    <Plus className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-300">No items added to quote</h4>
                  <p className="text-[11px] text-slate-500 max-w-xs">
                    Select products from the catalog on the left to populate quotation line items.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {cartLines.map((line) => {
                    const lineGross = line.unitPrice * line.quantity;
                    const lineDiscount = lineGross * (line.discountPercentage / 100);
                    const lineNet = lineGross - lineDiscount;

                    return (
                      <div
                        key={line.id}
                        className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] space-y-3"
                      >
                        {/* Line Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">{line.product.name}</h4>
                            <span className="text-[10px] font-mono text-slate-500">{line.product.sku}</span>
                          </div>
                          <IconButton
                            variant="ghost"
                            size="xs"
                            onClick={() => handleRemoveLine(line.id)}
                            icon={<Trash2 className="h-3.5 w-3.5 text-red-400" />}
                          />
                        </div>

                        {/* Line Controls Grid */}
                        <div className="grid grid-cols-3 gap-2 items-center text-xs">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10 p-1">
                            <button
                              onClick={() => handleUpdateQuantity(line.id, line.quantity - 1)}
                              className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-slate-200"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleUpdateQuantity(line.id, parseInt(e.target.value) || 1)}
                              className="w-10 bg-transparent text-center text-xs font-bold text-slate-100 focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateQuantity(line.id, line.quantity + 1)}
                              className="h-6 w-6 rounded flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-slate-200"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Line Discount Input */}
                          <div>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={line.discountPercentage}
                              onChange={(e) => handleUpdateDiscount(line.id, parseFloat(e.target.value) || 0)}
                              placeholder="Disc %"
                              className="h-8 text-xs text-center font-semibold"
                            />
                          </div>

                          {/* Line Total */}
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block">Line Total</span>
                            <span className="text-xs font-extrabold text-cyan-400">
                              {formatCurrency(lineNet)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>

          {/* RIGHT COLUMN: LIVE SUMMARY & MARGIN INDICATOR (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Proposal Summary
              </h3>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 text-xs text-slate-300 border-b border-white/[0.06] pb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal (Gross):</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(summary.subtotalGross)}</span>
                </div>
                <div className="flex justify-between text-amber-400">
                  <span>Total Discount:</span>
                  <span className="font-semibold">-{formatCurrency(summary.discountTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax (10% EST):</span>
                  <span>+{formatCurrency(summary.taxTotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-white/5">
                  <span>Grand Total:</span>
                  <span className="text-cyan-400">{formatCurrency(summary.grandTotal)}</span>
                </div>
              </div>

              {/* Margin Analysis & Safeguards */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Estimated Cost:</span>
                  <span className="font-mono text-slate-300">{formatCurrency(summary.totalCost)}</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Gross Margin ($):</span>
                  <span className="font-bold text-slate-100">{formatCurrency(summary.grossMarginAmount)}</span>
                </div>

                <div className="flex justify-between text-xs items-center">
                  <span className="text-slate-400">Margin Percentage:</span>
                  <span
                    className={`font-extrabold text-sm ${
                      summary.marginHealth === 'Healthy'
                        ? 'text-emerald-400'
                        : summary.marginHealth === 'Watch'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {summary.grossMarginPercentage.toFixed(1)}%
                  </span>
                </div>

                {/* VISUAL MARGIN SAFEGUARD INDICATOR */}
                <div className="p-3 rounded-lg border bg-white/[0.02] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">Margin Safeguard:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        summary.marginHealth === 'Healthy'
                          ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                          : summary.marginHealth === 'Watch'
                          ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                          : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/30 animate-pulse'
                      }`}
                    >
                      {summary.marginHealth === 'Healthy' && <CheckCircle2 className="h-3 w-3" />}
                      {summary.marginHealth === 'Watch' && <AlertTriangle className="h-3 w-3" />}
                      {summary.marginHealth === 'At Risk' && <ShieldAlert className="h-3 w-3" />}
                      {summary.marginHealth}
                    </span>
                  </div>

                  <ProgressBar
                    value={summary.grossMarginPercentage}
                    max={50}
                    size="sm"
                    variant={
                      summary.marginHealth === 'Healthy'
                        ? 'emerald'
                        : summary.marginHealth === 'Watch'
                        ? 'amber'
                        : 'danger'
                    }
                  />

                  {summary.requiresApproval && (
                    <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 leading-tight">
                      <strong>Approval Required:</strong> {summary.approvalReason}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* UPSELL & CROSS-SELL RECOMMENDATIONS EXPERIENCE */}
        <div className="pt-2">
          <UpsellPanel onAddProduct={handleAddProduct} layout="bottom" />
        </div>
      </div>


      {/* PREVIEW PROPOSAL MODAL */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Quotation Proposal Preview — ${selectedCustomer.name}`}
        description="Rendered commercial proposal view for client review"
        size="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsPreviewOpen(false)}>
            Close Preview
          </Button>
        }
      >
        <div className="space-y-6 text-xs text-slate-300 p-2">
          {/* Header */}
          <div className="flex justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100">DealFlow360 Quotation</h2>
              <p className="text-slate-400">Proposal Reference: QT-2026-DRAFT</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-100">{selectedCustomer.name}</p>
              <p className="text-slate-400">{selectedCustomer.contactPerson}</p>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Included Products</h3>
            <div className="divide-y divide-white/5 border border-white/10 rounded-lg p-2">
              {cartLines.map((line) => (
                <div key={line.id} className="flex justify-between py-1.5 px-2">
                  <span>{line.product.name} (x{line.quantity})</span>
                  <span className="font-bold text-cyan-400">
                    {formatCurrency(line.unitPrice * line.quantity * (1 - line.discountPercentage / 100))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between border-t border-white/10 pt-4 text-sm font-extrabold text-slate-100">
            <span>Total Proposal Amount:</span>
            <span className="text-cyan-400">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
