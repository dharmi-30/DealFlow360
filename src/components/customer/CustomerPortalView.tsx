import React, { useState } from 'react';
import { Quotation } from '../../types';
import { Badge } from '../common/Badge';
import {
  FileText,
  Calendar,
  Send,
  CheckCircle2,
  MessageSquare,
  ArrowLeft,
  User,
  ShieldCheck,
  Info,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface CustomerPortalViewProps {
  quotations: Quotation[];
  activeQuotationId?: string;
  onCustomerSubmitCounter: (
    quotationId: string,
    counterDiscountPct: number,
    message: string,
    deliveryDate?: string
  ) => void;
  onCustomerAcceptQuote: (quotationId: string) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  quotations,
  activeQuotationId,
  onCustomerSubmitCounter,
  onCustomerAcceptQuote,
}) => {
  const activeQuote =
    quotations.find((q) => q.id === activeQuotationId) ||
    quotations.find((q) => q.customerName === 'Acme Corp') ||
    quotations[0];

  const [portalTab, setPortalTab] = useState<'quotation' | 'messages' | 'profile'>('quotation');

  // Fields for customer negotiation
  const [counterDiscount, setCounterDiscount] = useState<number>(15.0);
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState<string>('2026-10-15');
  const [customerNote, setCustomerNote] = useState<string>('');

  // Status states
  const [quoteStatus, setQuoteStatus] = useState<string>(
    activeQuote?.status === 'accepted' || activeQuote?.status === 'fulfilled'
      ? 'Confirmed'
      : 'Under Negotiation'
  );
  const [submissionNotice, setSubmissionNotice] = useState<string | null>(null);

  // Line level customer comments state
  const [lineComments, setLineComments] = useState<{ [key: string]: string }>({
    'line-ext-warranty': 'Can this be 15% instead of 10%?',
    'line-setup-service': 'Can we push this to next month?',
    'line-laptop-hardware': 'Confirmed standard hardware spec',
  });

  // Configured discount threshold (15%)
  const maxAutoDiscountThreshold = 15.0;
  const isOverThreshold = counterDiscount > maxAutoDiscountThreshold;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    onCustomerSubmitCounter(
      activeQuote.id,
      counterDiscount,
      customerNote || 'Requested pricing adjustment & delivery date alignment.',
      requestedDeliveryDate
    );

    if (isOverThreshold) {
      setSubmissionNotice(
        `Your requested discount of ${counterDiscount}% exceeds standard threshold (${maxAutoDiscountThreshold}%). Your request has been submitted to your Account Manager (M. Shah) for manual review.`
      );
    } else {
      setSubmissionNotice(
        `Your request for ${counterDiscount}% discount and delivery date ${requestedDeliveryDate} has been submitted successfully.`
      );
    }

    setQuoteStatus('Under Negotiation');
  };

  const handleConfirmQuotation = () => {
    onCustomerAcceptQuote(activeQuote.id);
    setQuoteStatus('Confirmed');
    setSubmissionNotice('Quotation Q-1042 has been officially confirmed and accepted.');
  };

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#f5f7fa',
      }}
    >
      {/* Dev Switcher Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#38d9ff',
              boxShadow: '0 0 8px #38d9ff',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#38d9ff' }}>
            Client Procurement View
          </span>
        </div>

        <button className="btn-glass btn-glass-secondary btn-sm" onClick={onBackToInternal}>
          <ArrowLeft size={13} /> Switch to Sales Ops Console
        </button>
      </div>

      {/* CUSTOMER PORTAL SHELL & BRAND HEADER */}
      <div
        style={{
          background: 'rgba(15, 28, 48, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px 32px',
          marginBottom: '28px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2f8cff 0%, #0554ba 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(47, 140, 255, 0.3)',
              }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Acme Corp Commercial Portal
              </h1>
              <p style={{ fontSize: '13px', color: '#9aa8ba', margin: '2px 0 0 0' }}>
                DealFlow360 Enterprise Procurement Portal
              </p>
            </div>
          </div>

          {/* CUSTOMER NAVIGATION: My Quotation, Messages, Profile */}
          <nav
            style={{
              display: 'flex',
              gap: '6px',
              background: 'rgba(7, 17, 31, 0.7)',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <button
              onClick={() => setPortalTab('quotation')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: portalTab === 'quotation' ? '#2f8cff' : 'transparent',
                color: portalTab === 'quotation' ? '#ffffff' : '#9aa8ba',
                transition: 'all 0.2s ease',
              }}
            >
              My Quotation
            </button>
            <button
              onClick={() => setPortalTab('messages')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: portalTab === 'messages' ? '#2f8cff' : 'transparent',
                color: portalTab === 'messages' ? '#ffffff' : '#9aa8ba',
                transition: 'all 0.2s ease',
              }}
            >
              Messages ({activeQuote.negotiationHistory.length})
            </button>
            <button
              onClick={() => setPortalTab('profile')}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: portalTab === 'profile' ? '#2f8cff' : 'transparent',
                color: portalTab === 'profile' ? '#ffffff' : '#9aa8ba',
                transition: 'all 0.2s ease',
              }}
            >
              Profile
            </button>
          </nav>
        </div>

        {/* Notice Toast */}
        {submissionNotice && (
          <div
            style={{
              background: isOverThreshold ? 'rgba(245, 181, 68, 0.12)' : 'rgba(49, 211, 138, 0.12)',
              border: `1px solid ${isOverThreshold ? 'rgba(245, 181, 68, 0.3)' : 'rgba(49, 211, 138, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px 18px',
              fontSize: '13px',
              color: isOverThreshold ? '#f5b544' : '#31d38a',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px',
            }}
          >
            {isOverThreshold ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{submissionNotice}</span>
          </div>
        )}

        {/* TAB 1: MY QUOTATION (MAIN PAGE) */}
        {portalTab === 'quotation' && (
          <div>
            {/* Title & Status */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Customer Portal Negotiation
                </h2>
                <p style={{ fontSize: '13px', color: '#9aa8ba', marginTop: '4px' }}>
                  Review commercial terms, propose counter-discounts, and align target delivery dates.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Status:</span>
                <span
                  style={{
                    background: quoteStatus === 'Confirmed' ? 'rgba(49, 211, 138, 0.15)' : 'rgba(245, 181, 68, 0.15)',
                    color: quoteStatus === 'Confirmed' ? '#31d38a' : '#f5b544',
                    border: `1px solid ${quoteStatus === 'Confirmed' ? 'rgba(49, 211, 138, 0.3)' : 'rgba(245, 181, 68, 0.3)'}`,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Clock size={14} /> {quoteStatus}
                </span>
              </div>
            </div>

            {/* QUOTATION SUMMARY BAR */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Proposal Code
                </span>
                <div className="font-mono" style={{ fontSize: '16px', fontWeight: 800, color: '#38d9ff' }}>
                  {activeQuote.code}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Account Representative
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f7fa' }}>
                  {activeQuote.salesRep}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Offer Expiration
                </span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#f5f7fa' }}>
                  {activeQuote.validUntil}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                  Proposal Total
                </span>
                <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: '#31d38a' }}>
                  ${activeQuote.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* QUOTATION LINES & CUSTOMER COMMENTS SECTION */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
                Quotation Line Items & Feedback Notes
              </h3>

              <div className="table-glass-wrapper" style={{ borderRadius: '10px' }}>
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Line Item</th>
                      <th>Category</th>
                      <th className="number-cell">Qty</th>
                      <th className="number-cell">Unit Price</th>
                      <th className="number-cell">Discount Given</th>
                      <th className="number-cell">Line Total</th>
                      <th>Customer Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeQuote.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: '#9aa8ba', padding: '20px' }}>
                          No line items found for this proposal.
                        </td>
                      </tr>
                    ) : (
                      activeQuote.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td style={{ fontWeight: 700, color: '#ffffff' }}>{item.productName}</td>
                          <td>
                            <span className="badge-glass badge-glass-neutral">Commercial</span>
                          </td>
                          <td className="number-cell font-mono">{item.quantity}</td>
                          <td className="number-cell font-mono">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="number-cell font-mono" style={{ color: '#38d9ff' }}>
                            {item.discountPct}%
                          </td>
                          <td className="number-cell font-mono" style={{ fontWeight: 700 }}>
                            ${item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#9aa8ba',
                                fontStyle: 'italic',
                                background: 'rgba(255, 255, 255, 0.03)',
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.05)',
                              }}
                            >
                              "{lineComments[item.id] || 'Confirmed standard commercial specification'}"
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CUSTOMER NEGOTIATION FORM FIELDS */}
            <form
              onSubmit={handleSubmitRequest}
              style={{
                background: 'rgba(7, 17, 31, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '28px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
                Submit Pricing Adjustment & Target Dates
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Field 1: Counter Discount % */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9aa8ba' }}>
                    Counter Discount %
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      step="0.5"
                      className="input-glass-select"
                      style={{ paddingRight: '32px', width: '100%', fontSize: '14px', fontWeight: 700 }}
                      value={counterDiscount}
                      onChange={(e) => setCounterDiscount(Number(e.target.value))}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9aa8ba',
                        fontSize: '13px',
                        fontWeight: 700,
                      }}
                    >
                      %
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Standard automated discount threshold: <strong>15.0%</strong>
                  </span>
                </div>

                {/* Field 2: Requested Delivery Date */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9aa8ba' }}>
                    Requested Delivery Date
                  </label>
                  <input
                    type="date"
                    className="input-glass-select"
                    style={{ width: '100%', fontSize: '14px' }}
                    value={requestedDeliveryDate}
                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Preferred delivery schedule for warehouse dispatch
                  </span>
                </div>

                {/* Rationale Textarea */}
                <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#9aa8ba' }}>
                    Additional Customer Notes & Rationale
                  </label>
                  <textarea
                    className="input-glass-select"
                    rows={3}
                    placeholder="Enter details regarding payment terms, volume commitments, or setup schedules..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Threshold Warning Banner if Over 15% */}
              {isOverThreshold && (
                <div
                  style={{
                    background: 'rgba(245, 181, 68, 0.08)',
                    border: '1px solid rgba(245, 181, 68, 0.25)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: '#f5b544',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Review Notice:</strong> Your counter request of {counterDiscount}% exceeds standard auto-approved discount threshold (15%). Submitting this request will forward it to your account manager for manual review.
                  </span>
                </div>
              )}

              {/* ACTIONS: Submit Request & Confirm Quotation */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '14px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: '16px',
                }}
              >
                <button type="submit" className="btn-glass btn-glass-secondary" style={{ padding: '10px 22px' }}>
                  <Send size={14} /> Submit Request
                </button>

                <button
                  type="button"
                  className="btn-glass btn-glass-success"
                  style={{ padding: '10px 26px', fontSize: '14px' }}
                  onClick={handleConfirmQuotation}
                >
                  <CheckCircle2 size={16} /> Confirm Quotation
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: MESSAGES */}
        {portalTab === 'messages' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              Commercial Negotiation History
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {activeQuote.negotiationHistory.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    background: msg.senderRole === 'customer' ? 'rgba(47, 140, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${msg.senderRole === 'customer' ? 'rgba(47, 140, 255, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                    padding: '14px 18px',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9aa8ba', marginBottom: '6px' }}>
                    <strong style={{ color: msg.senderRole === 'customer' ? '#38d9ff' : '#ffffff' }}>
                      {msg.senderName} ({msg.senderRole === 'customer' ? 'Acme Corp Procurement' : 'DealFlow360 Representative'})
                    </strong>
                    <span>{msg.timestamp}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#f5f7fa' }}>{msg.message}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {portalTab === 'profile' && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '16px' }}>
              Acme Corp Procurement Profile
            </h3>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px',
              }}
            >
              <div>
                Company Account: <strong style={{ color: '#ffffff' }}>Acme Corp</strong>
              </div>
              <div>
                Authorized Procurement Contact: <strong style={{ color: '#ffffff' }}>J. Rao (Procurement Director)</strong>
              </div>
              <div>
                Contact Email: <strong style={{ color: '#38d9ff' }}>j.rao@acmecorp.com</strong>
              </div>
              <div>
                Default Delivery Address: <strong style={{ color: '#ffffff' }}>100 Industrial Parkway, Suite 400, Dallas, TX 75201</strong>
              </div>
              <div>
                Standard Payment Terms: <strong style={{ color: '#31d38a' }}>Net 30 Commercial Accounts</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
