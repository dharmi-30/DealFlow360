'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Truck,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowLeft,
  DollarSign,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Send,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Button,
  IconButton,
  Badge,
  Modal,
  Input,
  useToast,
  ProgressBar,
} from '@/components/ui';
import { MOCK_FULFILLMENT_DATA } from '@/data/mockFulfillmentData';
import type { QuotationFulfillmentData, WarehouseStockItem } from '@/types/fulfillment';
import { formatCurrency } from '@/lib/utils';

export default function FulfillmentDetailPage({
  params,
}: {
  params: Promise<{ quotationId: string }>;
}) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const toast = useToast();

  const initialId = unwrappedParams.quotationId || 'qt_2026_0042';
  const initialData =
    MOCK_FULFILLMENT_DATA[initialId] ||
    MOCK_FULFILLMENT_DATA['qt_2026_0042'] ||
    Object.values(MOCK_FULFILLMENT_DATA)[0];

  // Editable local fulfillment state
  const [fulfillment, setFulfillment] = React.useState<QuotationFulfillmentData>(initialData);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);

  // Draft edits state for Manual Override Modal
  const [draftSplits, setDraftSplits] = React.useState<{
    [key: string]: number; // key: `${productId}_${warehouseId}` -> allocatedQty
  }>({});
  const [validationErrors, setValidationErrors] = React.useState<{ [key: string]: string }>({});

  // Initialize draft splits when opening modal
  const handleOpenOverrideModal = () => {
    const initial: { [key: string]: number } = {};
    fulfillment.items.forEach((item) => {
      item.warehouseSplits.forEach((wh) => {
        initial[`${item.productId}_${wh.warehouseId}`] = wh.allocatedQuantity;
      });
    });
    setDraftSplits(initial);
    setValidationErrors({});
    setIsOverrideModalOpen(true);
  };

  // Handle draft split change with live validation
  const handleDraftChange = (
    productId: string,
    warehouseId: string,
    val: number,
    availableStock: number
  ) => {
    const key = `${productId}_${warehouseId}`;
    const newDrafts = { ...draftSplits, [key]: val };
    setDraftSplits(newDrafts);

    const newErrors = { ...validationErrors };
    if (val < 0) {
      newErrors[key] = 'Quantity cannot be negative';
    } else if (val > availableStock) {
      newErrors[key] = `Exceeds available stock (${availableStock} available)`;
    } else {
      delete newErrors[key];
    }
    setValidationErrors(newErrors);
  };

  // Apply Manual Override Edits
  const handleApplyOverride = () => {
    if (Object.keys(validationErrors).length > 0) {
      toast.error('Validation Error', 'Please resolve quantity errors before saving.');
      return;
    }

    // Update fulfillment state with new quantities
    const updatedItems = fulfillment.items.map((item) => {
      const updatedSplits = item.warehouseSplits.map((wh) => {
        const key = `${item.productId}_${wh.warehouseId}`;
        const newQty = draftSplits[key] !== undefined ? draftSplits[key] : wh.allocatedQuantity;
        return {
          ...wh,
          allocatedQuantity: newQty,
        };
      });

      const totalAllocated = updatedSplits.reduce((acc, curr) => acc + curr.allocatedQuantity, 0);
      const newBackorder = Math.max(0, item.orderedQuantity - totalAllocated);

      return {
        ...item,
        warehouseSplits: updatedSplits,
        backorderQuantity: newBackorder,
      };
    });

    // Compute overall status
    const totalBackorders = updatedItems.reduce((acc, curr) => acc + curr.backorderQuantity, 0);
    const newStatus =
      totalBackorders > 0
        ? 'backordered'
        : updatedItems.every((i) =>
            i.warehouseSplits.every((w) => w.allocatedQuantity >= i.orderedQuantity)
          )
        ? 'allocated'
        : 'partially_allocated';

    setFulfillment((prev) => ({
      ...prev,
      status: newStatus,
      items: updatedItems,
    }));

    setIsOverrideModalOpen(false);
    toast.success('Manual Override Applied', 'Warehouse fulfillment allocation custom updated.');
  };

  // Accept Suggested Split
  const handleAcceptSuggestedSplit = () => {
    setFulfillment((prev) => ({
      ...prev,
      status: 'allocated',
    }));
    toast.success('Split Accepted', 'Recommended warehouse split accepted & dispatch orders generated.');
  };

  // Consolidate Backorder Action
  const handleConsolidateBackorder = () => {
    toast.info(
      'Backorder Consolidated',
      'Remaining backorder quantities consolidated into PO-88492 priority replenishment batch.'
    );
  };

  // Allocate Incoming Stock Action
  const handleAllocateIncomingStock = () => {
    if (!fulfillment.incomingStockAlert) return;
    const alert = fulfillment.incomingStockAlert;

    // Fulfill backorders using incoming stock
    const updatedItems = fulfillment.items.map((item) => ({
      ...item,
      backorderQuantity: 0,
      warehouseSplits: item.warehouseSplits.map((wh, idx) =>
        idx === 0
          ? {
              ...wh,
              allocatedQuantity: item.orderedQuantity,
              availableStock: wh.availableStock + alert.quantity,
            }
          : wh
      ),
    }));

    setFulfillment((prev) => ({
      ...prev,
      status: 'allocated',
      items: updatedItems,
      incomingStockAlert: undefined,
    }));

    toast.success(
      'Stock Allocated',
      `Allocated ${alert.quantity} units from incoming batch ${alert.poNumber}. Backorders resolved!`
    );
  };

  // Overall Financial & Shipping Metrics
  const totalShipments = React.useMemo(() => {
    return fulfillment.items.reduce((acc, item) => {
      return acc + item.warehouseSplits.reduce((wAcc, wh) => wAcc + (wh.allocatedQuantity > 0 ? 1 : 0), 0);
    }, 0);
  }, [fulfillment]);

  const totalShippingCost = React.useMemo(() => {
    return fulfillment.items.reduce((acc, item) => {
      return acc + item.warehouseSplits.reduce((wAcc, wh) => wAcc + (wh.allocatedQuantity > 0 ? wh.estimatedShippingCost : 0), 0);
    }, 0);
  }, [fulfillment]);

  const totalBackorders = React.useMemo(() => {
    return fulfillment.items.reduce((acc, item) => acc + item.backorderQuantity, 0);
  }, [fulfillment]);

  return (
    <AppShell title="Fulfillment & Warehouse Split" subtitle="Multi-Location Logistics & Allocation Engine">
      {/* PAGE HEADER */}
      <PageHeader
        title={`Fulfillment Split: ${fulfillment.quotationNumber}`}
        subtitle={`Customer: ${fulfillment.customerName} | Order Value: ${formatCurrency(fulfillment.orderValue)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/quotations/${fulfillment.quotationId}`)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Quote</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={handleOpenOverrideModal}>
              <Sliders className="h-3.5 w-3.5 text-purple-400" />
              <span>Manual Override</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptSuggestedSplit}
              disabled={fulfillment.status === 'allocated'}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{fulfillment.status === 'allocated' ? 'Split Confirmed' : 'Accept Suggested Split'}</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* HEADER SUMMARY CARD */}
        <GlassCard className="p-5 border-l-4 border-l-cyan-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Quote & Customer */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Quote Reference</span>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                {fulfillment.quotationNumber}
              </h3>
              <p className="text-xs text-slate-300 font-semibold">{fulfillment.customerName}</p>
            </div>

            {/* Order Value */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Order Value</span>
              <div className="text-lg font-extrabold text-cyan-400">{formatCurrency(fulfillment.orderValue)}</div>
              <span className="text-[10px] text-slate-500">Confirmed Contract Amount</span>
            </div>

            {/* Fulfillment Status */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Fulfillment Status</span>
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${
                    fulfillment.status === 'allocated'
                      ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
                      : fulfillment.status === 'backordered'
                      ? 'bg-red-500/15 text-red-400 ring-red-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-400 ring-amber-500/30'
                  }`}
                >
                  {fulfillment.status === 'allocated' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {fulfillment.status === 'backordered' && <AlertTriangle className="h-3.5 w-3.5" />}
                  {fulfillment.status === 'pending_allocation' && <Clock className="h-3.5 w-3.5" />}
                  {fulfillment.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Split Metrics */}
            <div className="space-y-1 text-right md:border-l border-white/10 md:pl-6">
              <span className="text-[10px] font-mono uppercase text-slate-400">Logistics Summary</span>
              <p className="text-xs text-slate-200 font-medium">
                {totalShipments} Shipments | {formatCurrency(totalShippingCost)}
              </p>
              {totalBackorders > 0 ? (
                <span className="text-xs font-bold text-red-400 block">{totalBackorders} Backordered Units</span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 block">100% In-Stock Allocated</span>
              )}
            </div>
          </div>
        </GlassCard>

        {/* BACKORDER ALERT SECTION (When stock is insufficient) */}
        {totalBackorders > 0 && (
          <GlassCard className="p-4 bg-red-500/10 border-red-500/30 border-l-4 border-l-red-500 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                    Inventory Deficit: {totalBackorders} Units Backordered
                  </h4>
                  <p className="text-xs text-red-300">
                    Current warehouse stock is insufficient to fulfill total ordered quantities for this deal.
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleConsolidateBackorder}
                className="shrink-0 bg-red-500/20 text-red-200 hover:bg-red-500/30 border-red-500/40"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Consolidate Remaining Backorder</span>
              </Button>
            </div>

            {/* INCOMING MOCK STOCK PROMPT BANNER */}
            {fulfillment.incomingStockAlert && (
              <div className="mt-2 p-3 rounded-lg bg-black/40 border border-amber-500/30 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Mock Stock Alert:</strong> {fulfillment.incomingStockAlert.quantity} units incoming to{' '}
                    <em>{fulfillment.incomingStockAlert.warehouseName}</em> on {fulfillment.incomingStockAlert.expectedDate} (PO Ref: {fulfillment.incomingStockAlert.poNumber}).
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleAllocateIncomingStock} className="shrink-0 text-amber-300 border-amber-500/40 hover:bg-amber-500/10 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Allocate Incoming Stock
                </Button>
              </div>
            )}
          </GlassCard>
        )}

        {/* INVENTORY SUMMARY & REQUIRED PRODUCTS */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Inventory Summary — Required Products
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {fulfillment.items.length} Product Line(s) Required
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fulfillment.items.map((prod) => (
              <div
                key={prod.productId}
                className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.03] space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{prod.productName}</h4>
                    <span className="text-[10px] font-mono text-cyan-400">{prod.sku}</span>
                  </div>
                  {prod.backorderQuantity > 0 ? (
                    <Badge variant="danger">
                      {prod.backorderQuantity} Backordered
                    </Badge>
                  ) : (
                    <Badge variant="success">
                      In Stock
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-white/5 text-center">
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Ordered</span>
                    <span className="text-xs font-bold text-slate-100">{prod.orderedQuantity}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-[9px] text-slate-400 uppercase block font-semibold">Available</span>
                    <span className="text-xs font-bold text-emerald-400">{prod.totalAvailableStock}</span>
                  </div>
                  <div className={`p-2 rounded ${prod.backorderQuantity > 0 ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-slate-400'}`}>
                    <span className="text-[9px] uppercase block font-semibold">Backorder</span>
                    <span className="text-xs font-bold">{prod.backorderQuantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* WAREHOUSE SPLIT RECOMMENDATION TABLE & VISUAL SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* TABLE: WAREHOUSE ALLOCATION SPLIT (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recommended Warehouse Split Allocation
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Optimized by proximity & stock depth</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="py-2.5 px-3">Warehouse Hub</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3 text-right">Available Stock</th>
                      <th className="py-2.5 px-3 text-right">Allocated Qty</th>
                      <th className="py-2.5 px-3 text-center">Shipments</th>
                      <th className="py-2.5 px-3 text-right">Est. Shipping Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {fulfillment.items.flatMap((prod) =>
                      prod.warehouseSplits.map((wh) => (
                        <tr key={`${prod.productId}_${wh.warehouseId}`} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-slate-200">
                            <div className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                              <span>{wh.warehouseName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono pl-5 block">
                              {wh.location}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-200 block">{prod.productName}</span>
                            <span className="text-[10px] font-mono text-cyan-400">{prod.sku}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-300 font-semibold">
                            {wh.availableStock} units
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-400">
                            {wh.allocatedQuantity} units
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/5">
                              {wh.allocatedQuantity > 0 ? `${wh.shipmentCount} Shipment` : 'None'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-slate-200 font-mono">
                            {wh.allocatedQuantity > 0 ? formatCurrency(wh.estimatedShippingCost) : '$0.00'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </div>

          {/* VISUAL SUMMARY CARD (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-5 space-y-4 border-l-4 border-l-purple-500">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                Visual Split Summary
              </h3>

              {/* RECOMMENDED SPLIT BREAKDOWN LIST */}
              <div className="space-y-2 border-b border-white/10 pb-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Recommended Fulfillment Split
                </span>
                {fulfillment.items.map((prod) => (
                  <div key={prod.productId} className="space-y-1 text-xs">
                    <span className="font-semibold text-slate-300 text-[11px] block">{prod.productName}:</span>
                    {prod.warehouseSplits.map((wh) => (
                      <div key={wh.warehouseId} className="flex justify-between text-slate-400 pl-2">
                        <span>{wh.warehouseName} →</span>
                        <span className="font-bold text-cyan-400">{wh.allocatedQuantity} units</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* METRICS */}
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Shipments Required:</span>
                  <span className="font-bold text-slate-100">{totalShipments} Shipments</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Shipping Cost:</span>
                  <span className="font-bold text-cyan-400 font-mono">{formatCurrency(totalShippingCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Backordered Units:</span>
                  <span className={`font-bold ${totalBackorders > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {totalBackorders} Units
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAcceptSuggestedSplit}
                  disabled={fulfillment.status === 'allocated'}
                  className="w-full justify-center gap-1.5 text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{fulfillment.status === 'allocated' ? 'Split Accepted' : 'Accept Suggested Split'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenOverrideModal}
                  className="w-full justify-center gap-1.5 text-xs border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Manual Override Split</span>
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* MANUAL OVERRIDE MODAL / DRAWER */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Manual Warehouse Split Override"
        description="Adjust allocated inventory quantities per warehouse. Allocations cannot exceed available stock."
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400">
              {Object.keys(validationErrors).length > 0 ? (
                <span className="text-red-400 font-semibold">
                  ⚠️ Resolve {Object.keys(validationErrors).length} quantity error(s) before saving
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">✓ All allocation quantities valid</span>
              )}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApplyOverride}
                disabled={Object.keys(validationErrors).length > 0}
              >
                Apply Override
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-xs text-slate-300 max-h-[500px] overflow-y-auto pr-1">
          {fulfillment.items.map((prod) => (
            <div key={prod.productId} className="space-y-3 p-3.5 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h4 className="font-bold text-slate-100 text-xs">{prod.productName}</h4>
                  <span className="text-[10px] font-mono text-cyan-400">{prod.sku}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Ordered Quantity:</span>
                  <span className="font-extrabold text-slate-100">{prod.orderedQuantity} units</span>
                </div>
              </div>

              {/* WAREHOUSE ALLOCATION INPUT FIELDS */}
              <div className="space-y-3">
                {prod.warehouseSplits.map((wh) => {
                  const key = `${prod.productId}_${wh.warehouseId}`;
                  const currentVal =
                    draftSplits[key] !== undefined ? draftSplits[key] : wh.allocatedQuantity;
                  const error = validationErrors[key];

                  return (
                    <div
                      key={wh.warehouseId}
                      className={`p-3 rounded-lg border space-y-2 transition-all ${
                        error ? 'bg-red-500/10 border-red-500/40' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="font-semibold text-slate-200">{wh.warehouseName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          Available Stock: <strong>{wh.availableStock}</strong> units
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                        <div>
                          <Input
                            type="number"
                            min="0"
                            max={wh.availableStock}
                            value={currentVal}
                            onChange={(e) =>
                              handleDraftChange(
                                prod.productId,
                                wh.warehouseId,
                                parseInt(e.target.value) || 0,
                                wh.availableStock
                              )
                            }
                            label="Allocated Quantity"
                            error={error}
                            className="h-8 text-xs font-mono font-bold"
                          />
                        </div>

                        <div className="text-right text-[11px] text-slate-400 pt-3 sm:pt-0">
                          <span>Est. Shipping: </span>
                          <span className="font-mono text-slate-200 font-bold">
                            {formatCurrency(currentVal > 0 ? wh.estimatedShippingCost : 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
