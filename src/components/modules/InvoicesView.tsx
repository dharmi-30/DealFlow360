import React, { useState } from 'react';
import { InvoiceRecord } from '../../types';
import { Badge } from '../common/Badge';
import { InvoiceModal } from './InvoiceModal';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Truck,
  Info,
  ChevronRight,
  Download,
  CreditCard,
} from 'lucide-react';

interface InvoicesViewProps {
  invoices: InvoiceRecord[];
  onMarkPaid: (invoiceId: string) => void;
  onSendReminder?: (invoiceId: string) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onMarkPaid,
  onSendReminder,
}) => {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(invoices[0] || null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const unpaidInvoices = invoices.filter((i) => i.status !== 'paid');
  const paidInvoices = invoices.filter((i) => i.status === 'paid');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Invoices & Financial Ledger</h1>
          <p className="page-subheading">
            Accounts receivable, quantity-based partial invoicing, and commercial payment reconciliation.
          </p>
        </div>

        <div
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#f5b544',
            backgroundColor: 'rgba(245,181,68,0.08)',
            padding: '6px 14px',
            borderRadius: '6px',
            border: '1px solid rgba(245,181,68,0.2)',
          }}
        >
          Unpaid Invoices: <strong className="font-mono">{unpaidInvoices.length} Accounts</strong>
        </div>
      </div>

      {/* TOP SUMMARY */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Unpaid Invoices</span>
            <AlertCircle size={16} style={{ color: '#f5b544' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#f5b544' }}>
            {unpaidInvoices.length} Unpaid
          </div>
          <div className="kpi-sub-label">Collection receivables awaiting reconciliation</div>
        </div>

        <div className="kpi-glass-card">
          <div className="kpi-head">
            <span className="kpi-label">Paid Invoices</span>
            <CheckCircle2 size={16} style={{ color: '#31d38a' }} />
          </div>
          <div className="kpi-main-val" style={{ color: '#31d38a' }}>
            {paidInvoices.length} Paid
          </div>
          <div className="kpi-sub-label">Commercial accounts fully settled</div>
        </div>
      </div>

      {/* OPERATIONAL POLICY NOTICE */}
      <div
        style={{
          background: 'rgba(47, 140, 255, 0.08)',
          border: '1px solid rgba(47, 140, 255, 0.2)',
          borderRadius: '6px',
          padding: '12px 18px',
          fontSize: '13px',
          color: '#2f8cff',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Info size={18} style={{ color: '#38d9ff', flexShrink: 0 }} />
        <span>
          <strong>Fulfillment Invoicing Policy:</strong> Invoicing ledger entries are linked directly to their originating quotation records.
        </span>
      </div>

      {/* INVOICES TABLE */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
            Invoices Ledger
          </h3>
          <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
            Select invoice row to inspect detail & ledger timeline
          </span>
        </div>

        <div className="table-glass-wrapper">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th className="number-cell">Amount</th>
                <th className="number-cell">Paid</th>
                <th>Status</th>
                <th>Due Date</th>
                <th className="number-cell">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isSelected = selectedInvoice?.id === inv.id;
                return (
                  <tr
                    key={inv.id}
                    className={`clickable ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => setSelectedInvoice(inv)}
                    style={{
                      background: isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                    }}
                  >
                    <td className="font-mono" style={{ fontWeight: 700, color: '#38d9ff' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f5f7fa' }}>{inv.customerName}</div>
                      <div style={{ fontSize: '11px', color: '#9aa8ba' }}>Ref: {inv.quotationCode}</div>
                    </td>
                    <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#f5f7fa' }}>
                      ${inv.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#31d38a' }}>
                      ${inv.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <Badge status={inv.status} />
                    </td>
                    <td className="font-mono" style={{ fontSize: '12px', color: inv.status !== 'paid' ? '#f5b544' : '#9aa8ba' }}>
                      {inv.dueDate}
                    </td>
                    <td className="number-cell">
                      <button
                        className="btn-glass btn-glass-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                          setIsModalOpen(true);
                        }}
                      >
                        <FileText size={12} /> Inspect Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INVOICE DETAIL INSPECTOR */}
      {selectedInvoice && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '20px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: '#38d9ff' }}>
                  {selectedInvoice.invoiceNumber}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  {selectedInvoice.customerName}
                </h3>
              </div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                Ref Quote: <strong className="font-mono" style={{ color: '#2f8cff' }}>{selectedInvoice.quotationCode}</strong> | Due Date: <strong className="font-mono">{selectedInvoice.dueDate}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#9aa8ba', fontWeight: 700 }}>
                Total Invoiced Amount
              </div>
              <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: '#31d38a' }}>
                ${selectedInvoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {selectedInvoice.status !== 'paid' && (
              <button
                className="btn-glass btn-glass-success"
                onClick={() => onMarkPaid(selectedInvoice.id)}
              >
                <CreditCard size={14} /> Record Payment
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULL INVOICE PRINT MODAL */}
      {isModalOpen && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setIsModalOpen(false)}
          onMarkPaid={(id) => onMarkPaid(id)}
        />
      )}
    </div>
  );
};
