'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  Calendar,
  ArrowLeft,
  Sliders,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Layers,
  FileText,
  Info,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  useToast,
  Tabs,
} from '@/components/ui';
import { MOCK_SUBSCRIPTIONS } from '@/data/mockSubscriptionData';
import type { SubscriptionDetail, SubscriptionStatus } from '@/types/subscriptions';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const toast = useToast();

  const subId = unwrappedParams.id || 'sub_2026_01';
  const initialSub =
    MOCK_SUBSCRIPTIONS.find((s) => s.id === subId || s.subscriptionNumber === subId) ||
    MOCK_SUBSCRIPTIONS[0];

  const [sub, setSub] = React.useState<SubscriptionDetail>(initialSub);

  // Modals state
  const [isProrationModalOpen, setIsProrationModalOpen] = React.useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState(false);

  // Proration state
  const [newQuantity, setNewQuantity] = React.useState<number>(sub.quantity);

  // Cancellation state
  const [cancelOption, setCancelOption] = React.useState<'end_of_period' | 'immediate'>('end_of_period');

  // Compute proration preview
  const prorationPreview = React.useMemo(() => {
    const qtyDiff = newQuantity - sub.quantity;
    const unitPricePerSeat = 950; // base price
    const daysRemainingInPeriod = 12; // mock 12 days left out of 30
    const daysInYear = 365;

    const proratedAmount = (qtyDiff * unitPricePerSeat * (daysRemainingInPeriod / daysInYear)) * 10;
    return {
      qtyDiff,
      daysRemainingInPeriod,
      proratedAmount: Math.round(proratedAmount * 100) / 100,
      isCredit: qtyDiff < 0,
    };
  }, [newQuantity, sub.quantity]);

  // Compute cancellation credit note estimate
  const cancellationEstimate = React.useMemo(() => {
    if (cancelOption === 'end_of_period') {
      return { refundAmount: 0, creditDays: 0 };
    }
    // Immediate cancellation refund estimate (mock remaining period)
    const unusedDays = 12;
    const dailyRate = sub.recurringAmount / 365;
    const estimatedRefund = Math.round(dailyRate * unusedDays * 100) / 100;
    return { refundAmount: estimatedRefund, creditDays: unusedDays };
  }, [cancelOption, sub.recurringAmount]);

  // Apply Proration
  const handleApplyProration = () => {
    if (newQuantity <= 0) {
      toast.error('Invalid Quantity', 'Quantity must be at least 1 seat.');
      return;
    }

    setSub((prev) => ({
      ...prev,
      quantity: newQuantity,
      recurringAmount: Math.round(prev.recurringAmount * (newQuantity / prev.quantity)),
    }));

    setIsProrationModalOpen(false);
    toast.success(
      'Proration Applied',
      `Quantity updated to ${newQuantity} seats. Net effect: ${
        prorationPreview.proratedAmount >= 0 ? '+' : ''
      }${formatCurrency(prorationPreview.proratedAmount)}`
    );
  };

  // Confirm Cancellation
  const handleConfirmCancellation = () => {
    const newStatus: SubscriptionStatus =
      cancelOption === 'immediate' ? 'canceled' : 'pending_cancellation';

    setSub((prev) => ({
      ...prev,
      status: newStatus,
    }));

    setIsCancelModalOpen(false);
    toast.warning(
      'Subscription Canceled',
      cancelOption === 'immediate'
        ? 'Subscription canceled immediately. Credit Note issued.'
        : `Subscription will cancel at end of billing cycle (${formatDate(sub.nextBillingDate)}).`
    );
  };

  // Separate Recurring lines vs One-time lines
  const recurringLines = sub.lines.filter((l) => l.isRecurring);
  const oneTimeLines = sub.lines.filter((l) => !l.isRecurring);

  return (
    <AppShell title="Subscription Detail" subtitle="Recurring Contract & Proration Management">
      <PageHeader
        title={`Subscription: ${sub.subscriptionNumber}`}
        subtitle={`Customer: ${sub.customerName} | Plan: ${sub.planName}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/subscriptions')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Directory</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewQuantity(sub.quantity);
                setIsProrationModalOpen(true);
              }}
              disabled={sub.status === 'canceled'}
            >
              <Sliders className="h-3.5 w-3.5 text-cyan-400" />
              <span>Change Quantity / Proration</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={sub.status === 'canceled' || sub.status === 'pending_cancellation'}
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Cancel Subscription</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* HEADER OVERVIEW CARD */}
        <GlassCard className="p-5 border-l-4 border-l-violet-500">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Subscription Ref</span>
              <h3 className="text-base font-extrabold text-slate-100">{sub.subscriptionNumber}</h3>
              <p className="text-xs text-slate-300 font-semibold">{sub.customerName}</p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Contract Plan</span>
              <div className="text-xs font-bold text-slate-100">{sub.planName}</div>
              <span className="text-[10px] text-slate-400 capitalize">{sub.billingCycle} Cycle</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Status</span>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    sub.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : sub.status === 'trialing'
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                      : sub.status === 'past_due'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {sub.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Next Billing Date</span>
              <div className="text-xs font-bold text-slate-100 font-mono">{formatDate(sub.nextBillingDate)}</div>
              <span className="text-[10px] text-slate-500">Auto-renews on cycle</span>
            </div>

            <div className="text-right md:border-l border-white/10 md:pl-6">
              <span className="text-[10px] font-mono uppercase text-slate-400">Recurring Total</span>
              <div className="text-lg font-extrabold text-cyan-400 font-mono">
                {formatCurrency(sub.recurringAmount)}
              </div>
              <span className="text-[10px] text-slate-400 font-bold">{sub.quantity} Active Seats</span>
            </div>
          </div>
        </GlassCard>

        {/* RECURRING LINES VS ONE-TIME PRODUCTS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* RECURRING LINES TABLE (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-violet-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Recurring Subscription Lines ({recurringLines.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Billed on cycle</span>
              </div>

              <div className="divide-y divide-white/5">
                {recurringLines.map((line) => (
                  <div key={line.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{line.name}</h4>
                      <span className="text-[10px] font-mono text-cyan-400">{line.sku}</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Quantity</span>
                        <span className="font-bold text-slate-200">{line.quantity}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Unit Price</span>
                        <span className="font-mono text-slate-300">{formatCurrency(line.unitPrice)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Recurring Total</span>
                        <span className="font-extrabold text-cyan-400 font-mono">
                          {formatCurrency(line.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* ONE-TIME PRODUCTS TABLE */}
            {oneTimeLines.length > 0 && (
              <GlassCard className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      One-Time Upfront Products & Services ({oneTimeLines.length})
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Charged once</span>
                </div>

                <div className="divide-y divide-white/5">
                  {oneTimeLines.map((line) => (
                    <div key={line.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">{line.name}</h4>
                        <span className="text-[10px] font-mono text-cyan-400">{line.sku}</span>
                      </div>

                      <div className="flex items-center gap-6 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Quantity</span>
                          <span className="font-bold text-slate-200">{line.quantity}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Unit Price</span>
                          <span className="font-mono text-slate-300">{formatCurrency(line.unitPrice)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">One-Time Fee</span>
                          <span className="font-extrabold text-amber-400 font-mono">
                            {formatCurrency(line.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>

          {/* BILLING SCHEDULE TIMELINE (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Billing Schedule Timeline
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Future & Past Cycles</span>
              </div>

              <div className="space-y-3">
                {sub.billingSchedule.map((sched) => (
                  <div
                    key={sched.id}
                    className="p-3 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-cyan-400">
                          {formatDate(sched.billingDate)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            sched.status === 'paid'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : sched.status === 'scheduled'
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-amber-500/15 text-amber-400 animate-pulse'
                          }`}
                        >
                          {sched.status}
                        </span>
                      </div>
                      <p className="font-medium text-slate-200 text-[11px]">{sched.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-slate-100 font-mono block">
                        {formatCurrency(sched.amount)}
                      </span>
                      {sched.invoiceId && (
                        <Link href={`/invoices/${sched.invoiceId}`} className="text-[10px] text-cyan-400 hover:underline">
                          View Invoice
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* PRORATION / QUANTITY CHANGE MODAL */}
      <Modal
        isOpen={isProrationModalOpen}
        onClose={() => setIsProrationModalOpen(false)}
        title="Subscription Proration Preview & Adjustment"
        description="Preview prorated charges for mid-cycle quantity/seat changes"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400">
              Effect: <strong>{prorationPreview.proratedAmount >= 0 ? '+' : ''}{formatCurrency(prorationPreview.proratedAmount)}</strong>
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsProrationModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleApplyProration}>
                Apply Proration Change
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5 text-xs text-slate-300">
          {/* EXPLICIT PREVIEW DISCLAIMER BANNER */}
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
            <div>
              <strong className="block text-[11px] uppercase tracking-wider">Proration Preview Mode</strong>
              <p className="text-[11px] opacity-90">
                Calculations are generated via frontend proration rules for immediate feedback. Final invoice amounts will be confirmed upon backend billing sync.
              </p>
            </div>
          </div>

          {/* QUANTITY INPUTS */}
          <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Quantity / Seats</span>
              <div className="text-lg font-bold text-slate-200 mt-1">{sub.quantity} Seats</div>
            </div>
            <div>
              <Input
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                label="New Quantity / Seats"
                className="h-9 font-bold text-sm font-mono"
              />
            </div>
          </div>

          {/* PRORATION CALCULATION BREAKDOWN */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
            <h4 className="font-bold text-slate-200 uppercase text-[11px]">Proration Calculation Breakdown</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Billing Period:</span>
                <span className="font-mono text-slate-200">Aug 15, 2026 – Sep 15, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unused Days Remaining in Cycle:</span>
                <span className="font-mono text-slate-200">{prorationPreview.daysRemainingInPeriod} Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seat Delta:</span>
                <span className="font-mono font-bold text-slate-100">
                  {prorationPreview.qtyDiff >= 0 ? `+${prorationPreview.qtyDiff}` : prorationPreview.qtyDiff} Seats
                </span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-extrabold">
                <span className="text-slate-200">Prorated Amount Due / Credit:</span>
                <span className={prorationPreview.proratedAmount >= 0 ? 'text-cyan-400' : 'text-emerald-400'}>
                  {prorationPreview.proratedAmount >= 0 ? '+' : ''}{formatCurrency(prorationPreview.proratedAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* CANCELLATION MODAL */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Subscription Contract"
        description="Select effective cancellation timing and view estimated refund credit notes."
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
              Keep Subscription
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmCancellation} className="bg-red-600 hover:bg-red-500 text-white">
              Confirm Cancellation
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-xs text-slate-300">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-200 block">Cancellation Timing</label>

            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="cancelOption"
                  checked={cancelOption === 'end_of_period'}
                  onChange={() => setCancelOption('end_of_period')}
                  className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-bold text-slate-100 block">Cancel at end of billing period</span>
                  <span className="text-[11px] text-slate-400">
                    Access remains active until {formatDate(sub.nextBillingDate)}. No immediate refund needed.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                <input
                  type="radio"
                  name="cancelOption"
                  checked={cancelOption === 'immediate'}
                  onChange={() => setCancelOption('immediate')}
                  className="mt-0.5 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <span className="font-bold text-red-300 block">Cancel immediately</span>
                  <span className="text-[11px] text-slate-400">
                    Terminates access today and calculates estimated prorated refund credit note.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* ESTIMATED REFUND CREDIT NOTE PANEL */}
          {cancelOption === 'immediate' && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
              <h5 className="font-bold text-red-200 text-xs uppercase tracking-wider">
                Estimated Refund Credit Note
              </h5>
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-300">Unused Days ({cancellationEstimate.creditDays} days remaining):</span>
                <span className="font-extrabold text-red-200 text-sm font-mono">
                  {formatCurrency(cancellationEstimate.refundAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
