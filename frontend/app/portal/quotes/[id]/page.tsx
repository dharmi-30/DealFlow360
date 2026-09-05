'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  FileText,
  UserCheck,
  Mail,
  Sliders,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  GlassCard,
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
  useToast,
} from '@/components/ui';
import { negotiationsService } from '@/services';
import type { QuotationDetail, QuotationItemDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerPortalQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const toast = useToast();

  const quoteId = unwrappedParams.id || 'qt_2026_0042';
  const [quote, setQuote] = React.useState<QuotationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [portalStatus, setPortalStatus] = React.useState<'Sent' | 'Under Negotiation' | 'Confirmed'>('Sent');

  React.useEffect(() => {
    let isMounted = true;
    negotiationsService.getNegotiationQuote(quoteId).then((data) => {
      if (isMounted && data) {
        setQuote(data);
        setPortalStatus(
          data.status === 'accepted' || data.status === 'approved'
            ? 'Confirmed'
            : data.status === 'negotiation'
            ? 'Under Negotiation'
            : 'Sent'
        );
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  // Negotiation submitted notification banner state
  const [hasSubmittedRequest, setHasSubmittedRequest] = React.useState(false);

  // Negotiation Modal state
  const [isNegotiationModalOpen, setIsNegotiationModalOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<QuotationItemDetail | null>(null);

  // Form states inside negotiation modal
  const [customerComment, setCustomerComment] = React.useState('');
  const [requestedQty, setRequestedQty] = React.useState<number>(1);
  const [requestedDiscount, setRequestedDiscount] = React.useState<number>(10);
  const [isCounterProposal, setIsCounterProposal] = React.useState(true);

  // Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  // Open negotiation modal for specific line item
  const handleOpenNegotiation = (item?: QuotationItemDetail) => {
    if (!quote) return;
    const target = item || quote.items[0];
    if (!target) return;
    setSelectedItem(target);
    setRequestedQty(target.quantity);
    setRequestedDiscount(target.discount);
    setCustomerComment('');
    setIsNegotiationModalOpen(true);
  };

  // Submit Negotiation Request
  const handleSubmitNegotiationRequest = async () => {
    if (!quote) return;
    if (!customerComment.trim()) {
      toast.error('Comment Required', 'Please provide a brief note explaining your change request.');
      return;
    }

    const updated = await negotiationsService.submitChangeRequest(quote.id, {
      lineId: selectedItem?.id,
      comment: `${customerComment} [Requested Qty: ${requestedQty}, Requested Discount: ${requestedDiscount}%]`,
      requestedQuantity: requestedQty,
      requestedDiscount: requestedDiscount,
      customerName: quote.customerContact,
    });

    setQuote(updated);
    setPortalStatus('Under Negotiation');
    setHasSubmittedRequest(true);
    setIsNegotiationModalOpen(false);

    toast.success(
      'Request Submitted',
      'Your change request has been submitted for review by your sales account manager.'
    );
  };

  // Confirm Quotation
  const handleConfirmQuotation = async () => {
    if (!quote) return;
    if (!acceptedTerms) {
      toast.error('Terms Acceptance Required', 'Please accept the proposal terms to confirm.');
      return;
    }

    const updated = await negotiationsService.confirmQuotation(quote.id);
    setQuote(updated);
    setPortalStatus('Confirmed');
    setIsConfirmModalOpen(false);
    toast.success('Quotation Confirmed!', `Commercial proposal ${quote.number} confirmed.`);
  };

  // Helper for status badge
  const renderStatusBadge = () => {
    switch (portalStatus) {
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Confirmed & Accepted
          </span>
        );
      case 'Under Negotiation':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
            <Clock className="h-3.5 w-3.5" />
            Under Negotiation / Approval Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30">
            <FileText className="h-3.5 w-3.5" />
            Sent for Client Review
          </span>
        );
    }
  };

  if (loading || !quote) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b15] text-slate-400 text-sm">
        Loading Customer Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* CUSTOMER PORTAL BRANDED HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090e1c]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 text-white font-black text-lg shadow-lg shadow-cyan-500/20">
              D
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                DealFlow360 <span className="text-xs font-medium text-slate-400">Customer Portal</span>
              </span>
              <p className="text-[11px] text-slate-400">Commercial Proposal Inspection</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-semibold">{quote.companyName}</span>
            </div>
            {renderStatusBadge()}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* SUBMITTED REQUEST NOTIFICATION BANNER */}
        {hasSubmittedRequest && (
          <GlassCard className="p-4 bg-amber-500/10 border-amber-500/30 border-l-4 border-l-amber-500 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Your request has been submitted for review.
              </h4>
              <p className="text-xs text-amber-300 opacity-90">
                Your requested change is currently in <strong>Approval Required</strong> status with sales management. Your account executive ({quote.salesRep.name}) will be notified immediately upon review.
              </p>
            </div>
          </GlassCard>
        )}

        {/* CONFIRMED STATE BANNER */}
        {portalStatus === 'Confirmed' && (
          <GlassCard className="p-5 bg-emerald-500/10 border-emerald-500/30 border-l-4 border-l-emerald-500 flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-emerald-200">
                Quotation Confirmed & Accepted!
              </h4>
              <p className="text-xs text-emerald-300">
                Thank you for confirming commercial proposal <strong>{quote.number}</strong>. Order fulfillment and warehouse allocation are now initialized.
              </p>
            </div>
          </GlassCard>
        )}

        {/* PROPOSAL METADATA & SALES REP BAR */}
        <GlassCard className="p-5 border-l-4 border-l-cyan-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            {/* Quote Reference */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Proposal Reference</span>
              <h2 className="text-lg font-extrabold text-slate-100">{quote.number}</h2>
              <span className="text-[11px] text-slate-400">Billed to {quote.customerName}</span>
            </div>

            {/* Dates */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Proposal Validity</span>
              <p className="text-slate-300">
                Issued: <strong className="text-slate-100">{formatDate(quote.createdAt)}</strong>
              </p>
              <p className="text-cyan-400 font-semibold">
                Valid Until: <strong>{formatDate(quote.validUntil)}</strong>
              </p>
            </div>

            {/* Sales Executive */}
            <div className="space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Your Account Executive</span>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs">
                  {quote.salesRep.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-100">{quote.salesRep.name}</p>
                  <p className="text-[10px] text-slate-400">{quote.salesRep.email}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-center md:items-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOpenNegotiation()}
                disabled={portalStatus === 'Confirmed'}
                className="w-full md:w-auto justify-center gap-1.5 text-xs"
              >
                <Sliders className="h-3.5 w-3.5 text-amber-400" />
                <span>Request Change / Counter</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsConfirmModalOpen(true)}
                disabled={portalStatus === 'Confirmed'}
                className="w-full md:w-auto justify-center gap-1.5 text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{portalStatus === 'Confirmed' ? 'Confirmed' : 'Confirm Quotation'}</span>
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* COMMERCIAL LINE ITEMS TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Commercial Proposal Products & Services ({quote.items.length})
            </h3>
            <span className="text-[11px] text-slate-400">All prices in USD ($)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Product / Service Description</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-center">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Discount Applied</th>
                  <th className="py-2.5 px-3 text-right">Total Line Price</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {quote.items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3.5 px-3 font-semibold text-slate-100">
                      {item.productName}
                      <span className="text-[10px] text-slate-400 block font-normal">{item.category}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-cyan-400 text-[11px]">{item.sku}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-200">{item.quantity}</td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-300">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      {item.discount > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">
                          -{item.discount}%
                        </span>
                      ) : (
                        <span className="text-slate-500">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-cyan-400 font-mono">
                      {formatCurrency(item.total)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenNegotiation(item)}
                          disabled={portalStatus === 'Confirmed'}
                          className="text-[11px] h-7 px-2"
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Comment / Request
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAL BREAKDOWN */}
          <div className="pt-4 border-t border-white/10 max-w-sm ml-auto space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal:</span>
              <span className="font-semibold text-slate-200">{formatCurrency(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax (10%):</span>
              <span>+{formatCurrency(quote.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-white/10">
              <span>Total Commercial Proposal:</span>
              <span className="text-cyan-400 font-mono text-base">{formatCurrency(quote.totalAmount)}</span>
            </div>
          </div>
        </GlassCard>

        {/* NEGOTIATION & COMMENTS THREAD */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Negotiation & Communication History
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              {quote.negotiationComments.length} Message(s)
            </span>
          </div>

          <div className="space-y-3">
            {quote.negotiationComments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No negotiation comments submitted yet. Use the "Request Change / Counter" button above to send a request to your account manager.
              </p>
            ) : (
              quote.negotiationComments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-xl border space-y-1.5 text-xs ${
                    comment.role === 'client'
                      ? 'bg-purple-500/10 border-purple-500/20 ml-4 border-l-4 border-l-purple-500'
                      : 'bg-white/5 border-white/10 mr-4 border-l-4 border-l-cyan-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-100">{comment.author}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{comment.timestamp}</span>
                  </div>
                  <p className="text-slate-200 leading-relaxed">{comment.message}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
      </main>

      {/* NEGOTIATION / CHANGE REQUEST MODAL */}
      <Modal
        isOpen={isNegotiationModalOpen}
        onClose={() => setIsNegotiationModalOpen(false)}
        title={`Request Change / Counter Proposal — ${selectedItem?.productName || quote.number}`}
        description="Submit requested quantity or discount adjustments for review by your account executive."
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsNegotiationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitNegotiationRequest}>
              <Send className="h-3.5 w-3.5 mr-1" />
              Submit Request for Review
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          {/* TARGET PRODUCT */}
          {selectedItem && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Target Line Item</span>
                <span className="font-bold text-slate-100">{selectedItem.productName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Current Unit Price</span>
                <span className="font-mono text-cyan-400 font-bold">{formatCurrency(selectedItem.unitPrice)}</span>
              </div>
            </div>
          )}

          {/* COUNTER DISCOUNT PROPOSAL TOGGLE */}
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-bold text-purple-200 block">Counter Discount Proposal</span>
              <span className="text-[11px] text-purple-300">
                Propose a custom discount or volume quantity adjustment.
              </span>
            </div>
            <input
              type="checkbox"
              checked={isCounterProposal}
              onChange={(e) => setIsCounterProposal(e.target.checked)}
              className="h-4 w-4 rounded text-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* ADJUSTMENT FIELDS */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="1"
              value={requestedQty}
              onChange={(e) => setRequestedQty(parseInt(e.target.value) || 1)}
              label="Requested Quantity"
              className="h-9 font-bold text-xs"
            />

            <Input
              type="number"
              min="0"
              max="100"
              value={requestedDiscount}
              onChange={(e) => setRequestedDiscount(parseFloat(e.target.value) || 0)}
              label="Requested Discount (%)"
              className="h-9 font-bold text-xs"
            />
          </div>

          {/* CUSTOMER COMMENT */}
          <Textarea
            value={customerComment}
            onChange={(e) => setCustomerComment(e.target.value)}
            label="Customer Note / Rationale"
            placeholder="e.g., Requesting 15% volume discount in exchange for multi-year contract commitment..."
            rows={3}
          />
        </div>
      </Modal>

      {/* CONFIRMATION SUMMARY MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title={`Confirm Commercial Proposal — ${quote.number}`}
        description="Review proposal summary and accept commercial terms."
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmModalOpen(false)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmQuotation}
              disabled={!acceptedTerms}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Confirm & Accept Proposal
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-2">
            <span className="text-[10px] font-bold uppercase text-emerald-300 tracking-wider block">
              Commercial Proposal Summary
            </span>
            <div className="flex justify-between text-sm font-extrabold text-slate-100">
              <span>Total Proposal Amount:</span>
              <span className="text-emerald-400 font-mono">{formatCurrency(quote.totalAmount)}</span>
            </div>
            <p className="text-[11px] text-emerald-200">
              Includes {quote.items.length} line items for {quote.companyName}.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-[11px] text-slate-300 leading-snug">
              I confirm that I am authorized on behalf of <strong>{quote.companyName}</strong> to accept commercial proposal terms and initialize contract fulfillment.
            </span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
