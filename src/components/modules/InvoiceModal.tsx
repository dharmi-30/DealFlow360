import React from 'react';
import { InvoiceRecord } from '../../types';
import { Badge } from '../common/Badge';
import { X, Printer, CheckCircle2, FileText, Check } from 'lucide-react';

interface InvoiceModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
  onMarkPaid: (invoiceId: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  onMarkPaid,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-box" style={{ width: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-input-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} style={{ color: '#2f8cff' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>Tax Invoice Document</h3>
            <Badge status={invoice.status} />
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#9aa8ba',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Close Invoice Document"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px', background: 'rgba(11, 25, 48, 0.95)' }}>
          {/* Invoice Lifecycle Progression Timeline */}
          <div className="stepper-row" style={{ marginBottom: '24px' }}>
            <div className="stepper-step completed">
              <Check size={14} />
              <span>1. Order Confirmed</span>
            </div>
            <div className="stepper-line completed" />
            <div className="stepper-step completed">
              <Check size={14} />
              <span>2. Shipped</span>
            </div>
            <div className="stepper-line completed" />
            <div className="stepper-step active">
              <span>3. Invoiced</span>
            </div>
            <div className="stepper-line" />
            <div className={`stepper-step ${invoice.status === 'paid' ? 'completed' : ''}`}>
              <span>4. Paid</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#f5f7fa' }}>DealFlow360 Operations Inc.</h2>
              <p style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                100 Enterprise Way, Suite 500<br />
                Austin, TX 78701 USA<br />
                EIN: 84-9920192 | billing@dealflow360.com
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="font-mono" style={{ fontSize: '18px', fontWeight: 700, color: '#38d9ff' }}>{invoice.invoiceNumber}</div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '4px' }}>
                Ref Quote: <strong className="font-mono" style={{ color: '#2f8cff' }}>{invoice.quotationCode}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#9aa8ba' }}>
                Payment Terms: <strong>{invoice.paymentTerms}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '6px' }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Billed To:</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', marginTop: '2px' }}>{invoice.customerName}</div>
              <div style={{ fontSize: '12px', color: '#9aa8ba' }}>Accounts Payable Department</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#9aa8ba' }}>
              <div>Issue Date: <strong style={{ color: '#f5f7fa' }}>{invoice.issueDate}</strong></div>
              <div style={{ marginTop: '2px' }}>Due Date: <strong style={{ color: invoice.status === 'overdue' ? '#ff6b72' : '#f5f7fa' }}>{invoice.dueDate}</strong></div>
            </div>
          </div>

          {/* Partial Invoicing Communication */}
          <div style={{ background: 'rgba(56, 217, 255, 0.08)', border: '1px solid rgba(56, 217, 255, 0.2)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px', color: '#38d9ff', marginBottom: '20px' }}>
            <strong>Fulfillment Note:</strong> Partial invoicing is tied to delivered quantities from warehouse fulfillment runs.
          </div>

          <div className="table-glass-wrapper" style={{ marginBottom: '20px' }}>
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="number-cell">Qty</th>
                  <th className="number-cell">Rate</th>
                  <th className="number-cell">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Enterprise Hardware & Software Solutions ({invoice.quotationCode})</td>
                  <td className="number-cell font-mono">1</td>
                  <td className="number-cell font-mono">${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="number-cell font-mono" style={{ fontWeight: 700 }}>${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', background: 'rgba(7,17,31,0.8)', padding: '14px', borderRadius: '6px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#9aa8ba' }}>Total Invoice Amount: <strong className="font-mono" style={{ fontSize: '14px', color: '#f5f7fa' }}>${invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>Amount Paid: <strong className="font-mono" style={{ fontSize: '14px', color: '#31d38a' }}>${invoice.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#38d9ff', marginTop: '6px' }}>
                Balance Due: ${ (invoice.totalAmount - invoice.amountPaid).toLocaleString('en-US', { minimumFractionDigits: 2 }) }
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn-glass btn-glass-secondary" onClick={handlePrint}>
            <Printer size={14} /> Download Summary / Print PDF
          </button>
          {invoice.status !== 'paid' && (
            <button
              className="btn-glass btn-glass-success"
              onClick={() => {
                onMarkPaid(invoice.id);
                onClose();
              }}
            >
              <CheckCircle2 size={15} /> Record Payment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
