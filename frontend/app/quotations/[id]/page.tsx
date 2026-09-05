'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  DollarSign,
  Percent,
  Calendar,
  User as UserIcon,
  Building2,
  Download,
  Send,
  CheckCircle2,
  Clock,
  Package,
  Receipt,
  MessageSquare,
  History,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  StatusBadge,
  RiskIndicator,
  ApprovalStatus,
  Tabs,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Avatar,
  Textarea,
  useToast,
} from '@/components/ui';
import { quotationsService } from '@/services';
import type { QuotationDetail } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const quoteId = (params?.id as string) || 'qt_2026_0042';

  const [quote, setQuote] = React.useState<QuotationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('overview');
  const [commentText, setCommentText] = React.useState('');

  React.useEffect(() => {
    let isMounted = true;
    quotationsService.getQuotationById(quoteId).then((data) => {
      if (isMounted) {
        setQuote(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [quoteId]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    toast.success('Comment Posted', 'Added response to negotiation log');
    setCommentText('');
  };

  if (loading || !quote) {
    return (
      <AppShell title="Loading Quotation Details...">
        <div className="flex h-64 items-center justify-center text-slate-400 text-sm">
          Loading quotation details...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Quotation ${quote.number}`} subtitle={quote.customerName}>
      {/* Top Back Link & Actions Header */}
      <PageHeader
        title={quote.number}
        subtitle={`Created on ${formatDate(quote.createdAt)} by ${quote.salesRep.name}`}
        badge={<StatusBadge status={quote.status} />}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/quotations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Quotations</span>
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => toast.info('PDF Export', 'Generating proposal PDF...')}>
              <Download className="h-3.5 w-3.5" />
              <span>Export PDF</span>
            </Button>
            <Button variant="primary" size="sm" onClick={() => toast.success('Sent to Client', `Proposal dispatched to ${quote.customerEmail}`)}>
              <Send className="h-3.5 w-3.5" />
              <span>Send to Client</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* SUMMARY HEADER CARD */}
        <GlassCard className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 border-l-4 border-l-cyan-500">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Customer</span>
            <p className="text-sm font-bold text-slate-100 mt-1 truncate">{quote.customerName}</p>
            <p className="text-[10px] text-slate-500 truncate">{quote.customerEmail}</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Amount</span>
            <p className="text-base font-extrabold text-cyan-400 mt-1">{formatCurrency(quote.totalAmount)}</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Discount %</span>
            <p className="text-sm font-bold text-amber-400 mt-1">{quote.discountPercentage}%</p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Margin %</span>
            <p className={`text-sm font-bold mt-1 ${quote.marginPercentage < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
              {quote.marginPercentage}%
            </p>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Risk Assessment</span>
            <div className="mt-1">
              <RiskIndicator level={quote.riskLevel} variant="badge" />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Account Owner</span>
            <div className="flex items-center gap-2 mt-1">
              <Avatar name={quote.salesRep.name} size="xs" />
              <span className="text-xs font-semibold text-slate-200">{quote.salesRep.name}</span>
            </div>
          </div>
        </GlassCard>

        {/* TABS NAVIGATION */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'items', label: `Items (${quote.items.length})` },
            { id: 'approval', label: 'Approval History' },
            { id: 'fulfillment', label: 'Fulfillment' },
            { id: 'billing', label: 'Billing & Invoices' },
            { id: 'negotiation', label: `Negotiation (${quote.negotiationComments.length})` },
            { id: 'activity', label: 'Audit Log' },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Proposal Summary & Terms</h3>
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Proposal Reference:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{quote.number}</p>
                </div>
                <div>
                  <span className="text-slate-500">Valid Until:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{formatDate(quote.validUntil)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Subtotal (Pre-tax):</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{formatCurrency(quote.subtotal)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tax / VAT Amount:</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{formatCurrency(quote.taxAmount)}</p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-2">
                <span className="text-xs font-semibold text-slate-300">Approval Workflow Status</span>
                <ApprovalStatus steps={quote.approvalHistory} />
              </div>
            </GlassCard>

            <GlassCard className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">Margin & Safeguard Check</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Target Minimum Margin:</span>
                  <span className="font-semibold text-slate-200">25.0%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Achieved Quote Margin:</span>
                  <span className={`font-bold ${quote.marginPercentage < 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {quote.marginPercentage}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Commercial Risk:</span>
                  <RiskIndicator level={quote.riskLevel} variant="compact" />
                </div>
              </div>
            </GlassCard>
          </div>
        )}

        {/* TAB 2: ITEMS */}
        {activeTab === 'items' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Quotation Line Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product / Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Discount %</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-cyan-400">{item.sku}</TableCell>
                    <TableCell className="font-semibold text-slate-200">{item.productName}</TableCell>
                    <TableCell className="text-slate-400">{item.category}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-amber-400 text-xs font-semibold">
                        {item.discount}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-100">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </GlassCard>
        )}

        {/* TAB 3: APPROVAL HISTORY */}
        {activeTab === 'approval' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Approval Trail & Sign-offs</h3>
            <ApprovalStatus steps={quote.approvalHistory} />
          </GlassCard>
        )}

        {/* TAB 4: FULFILLMENT */}
        {activeTab === 'fulfillment' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Warehouse Fulfillment Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Assigned Facility</span>
                <p className="font-semibold text-slate-200">{quote.fulfillmentDetails.warehouseName}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Fulfillment Status</span>
                <p className="font-bold text-cyan-400 capitalize">{quote.fulfillmentDetails.status.replace('_', ' ')}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Tracking Number</span>
                <p className="font-mono font-semibold text-slate-200">{quote.fulfillmentDetails.trackingNumber || 'Pending'}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB 5: BILLING */}
        {activeTab === 'billing' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Billing & Invoice Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Invoice Number</span>
                <p className="font-mono font-bold text-cyan-400">{quote.billingDetails.invoiceNumber || 'Not Generated'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Payment Status</span>
                <p className="font-semibold text-slate-200 capitalize">{quote.billingDetails.status.replace('_', ' ')}</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-1">
                <span className="text-slate-400">Due Date</span>
                <p className="font-semibold text-slate-200">{quote.billingDetails.dueDate || 'N/A'}</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* TAB 6: NEGOTIATION */}
        {activeTab === 'negotiation' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Client Negotiation Log</h3>
            <div className="space-y-3">
              {quote.negotiationComments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">{comment.author}</span>
                    <span className="text-[10px] text-slate-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-slate-300">{comment.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendComment} className="pt-4 space-y-2 border-t border-white/5">
              <Textarea
                placeholder="Type response or counter-proposal terms..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button variant="primary" size="sm" type="submit">
                Post Response
              </Button>
            </form>
          </GlassCard>
        )}

        {/* TAB 7: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <GlassCard className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Audit History</h3>
            <div className="space-y-2 text-xs">
              {quote.activityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 rounded bg-white/[0.02]">
                  <span className="font-medium text-slate-300">{log.action}</span>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                    <span>By: {log.performedBy}</span>
                    <span>{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </AppShell>
  );
}
