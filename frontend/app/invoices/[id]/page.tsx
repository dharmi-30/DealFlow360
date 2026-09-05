'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  Printer,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  History,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  Button,
  Badge,
  useToast,
} from '@/components/ui';
import { MOCK_INVOICES } from '@/data/mockInvoiceData';
import type { InvoiceDetail } from '@/types/invoices';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const unwrappedParams = React.use(params);
  const router = useRouter();
  const toast = useToast();

  const invId = unwrappedParams.id || 'inv_2026_104';
  const invoice =
    MOCK_INVOICES.find((i) => i.id === invId || i.invoiceNumber === invId) ||
    MOCK_INVOICES[0];

  const handleSendReminder = () => {
    toast.success('Payment Reminder Sent', `Dispatch email sent to ${invoice.customerEmail}`);
  };

  const handlePrintPdf = () => {
    toast.info('Generating PDF', `PDF document preview prepared for ${invoice.invoiceNumber}`);
  };

  const balanceDue = invoice.totalAmount - invoice.paidAmount;

  // Separate recurring vs one-time lines
  const recurringLines = invoice.lines.filter((l) => l.type === 'recurring');
  const oneTimeLines = invoice.lines.filter((l) => l.type === 'one_time');

  return (
    <AppShell title="Invoice Details" subtitle="Commercial Invoice Ledger & Billing Inspection">
      <PageHeader
        title={`Invoice: ${invoice.invoiceNumber}`}
        subtitle={`Customer: ${invoice.customerName} | Quote: ${invoice.quoteNumber}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/invoices')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Invoices</span>
            </Button>

            <Button variant="secondary" size="sm" onClick={handlePrintPdf}>
              <Printer className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </Button>

            <Button variant="primary" size="sm" onClick={handleSendReminder}>
              <Send className="h-3.5 w-3.5" />
              <span>Send Payment Reminder</span>
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {/* HEADER OVERVIEW CARD */}
        <GlassCard className="p-5 border-l-4 border-l-cyan-500">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Invoice Reference</span>
              <h3 className="text-base font-extrabold text-slate-100">{invoice.invoiceNumber}</h3>
              <span className="text-[10px] text-cyan-400 font-mono">Quote: {invoice.quoteNumber}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Billed Customer</span>
              <div className="text-xs font-bold text-slate-100">{invoice.customerName}</div>
              <span className="text-[10px] text-slate-400">{invoice.customerContact}</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Due Date</span>
              <div className="text-xs font-bold text-slate-100 font-mono">{formatDate(invoice.dueDate)}</div>
              <span className="text-[10px] text-slate-500">Net-30 Terms</span>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400">Payment Status</span>
              <div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : invoice.status === 'pending'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse'
                  }`}
                >
                  {invoice.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-right md:border-l border-white/10 md:pl-6">
              <span className="text-[10px] font-mono uppercase text-slate-400">Total Invoice Amount</span>
              <div className="text-lg font-extrabold text-cyan-400 font-mono">
                {formatCurrency(invoice.totalAmount)}
              </div>
              <span className="text-[10px] text-slate-400">
                Balance Due: <strong>{formatCurrency(balanceDue)}</strong>
              </span>
            </div>
          </div>
        </GlassCard>

        {/* MAIN INVOICE BILLING BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ITEMIZED BILLING LINES (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Itemized Billing Lines ({invoice.lines.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Issued {formatDate(invoice.issueDate)}</span>
              </div>

              {/* RECURRING CHARGES */}
              {recurringLines.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                    Recurring Subscription Charges
                  </span>
                  <div className="divide-y divide-white/5 border border-white/10 rounded-xl p-3 bg-white/[0.02]">
                    {recurringLines.map((line) => (
                      <div key={line.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <h4 className="font-bold text-slate-100">{line.description}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Qty: {line.quantity} × {formatCurrency(line.unitPrice)} (-{line.discount}% Disc)
                          </span>
                        </div>
                        <span className="font-extrabold text-cyan-400 font-mono">
                          {formatCurrency(line.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ONE-TIME CHARGES */}
              {oneTimeLines.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                    One-Time Upfront Charges
                  </span>
                  <div className="divide-y divide-white/5 border border-white/10 rounded-xl p-3 bg-white/[0.02]">
                    {oneTimeLines.map((line) => (
                      <div key={line.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <h4 className="font-bold text-slate-100">{line.description}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Qty: {line.quantity} × {formatCurrency(line.unitPrice)} (-{line.discount}% Disc)
                          </span>
                        </div>
                        <span className="font-extrabold text-amber-400 font-mono">
                          {formatCurrency(line.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FINANCIAL TOTALS BREAKDOWN */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs text-slate-300 max-w-sm ml-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-semibold text-slate-200">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Tax (10%):</span>
                  <span>+{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-2 border-t border-white/10">
                  <span>Total Amount:</span>
                  <span className="text-cyan-400 font-mono">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-400 pt-1">
                  <span>Paid Amount:</span>
                  <span className="font-bold">-{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-red-400 pt-1 border-t border-white/10">
                  <span>Balance Due:</span>
                  <span className="font-mono">{formatCurrency(balanceDue)}</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* ACTIVITY LOG TIMELINE (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <GlassCard className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Invoice Activity Log
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {invoice.activityLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-white/10 bg-white/[0.02] space-y-1 text-xs">
                    <p className="font-semibold text-slate-200 leading-tight">{log.action}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                      <span>By: {log.performedBy}</span>
                      <span className="font-mono">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
