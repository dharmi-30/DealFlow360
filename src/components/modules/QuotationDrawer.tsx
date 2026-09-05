import React, { useState, useEffect } from 'react';
import { Quotation, QuotationItem, Product } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  FileText,
  Send,
  Truck,
  AlertTriangle,
  MessageSquare,
  Building2,
  ExternalLink,
  Plus,
  CheckCircle2,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';

interface SuggestionItem {
  id: string;
  name: string;
  price: number;
  cogs: number;
  tag: string;
  discountPct: number;
  limitPct: number;
}

interface QuotationDrawerProps {
  quotation: Quotation | null;
  products?: Product[];
  onClose: () => void;
  onUpdateStatus: (quotationId: string, newStatus: Quotation['status']) => void;
  onOpenCustomerPortal: (quotationId: string) => void;
  onSendSalesRepMessage: (quotationId: string, message: string) => void;
}

export const QuotationDrawer: React.FC<QuotationDrawerProps> = ({
  quotation: initialQuotation,
  products = [],
  onClose,
  onUpdateStatus,
  onOpenCustomerPortal,
  onSendSalesRepMessage,
}) => {
  const [quotation, setQuotation] = useState<Quotation | null>(initialQuotation);
  const [repReply, setRepReply] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Suggestions state derived from schema.sql products
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>(() =>
    products.slice(0, 3).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.listPrice,
      cogs: p.cogs,
      tag: `Margin +$${Math.round(p.listPrice - p.cogs)}`,
      discountPct: p.defaultDiscountPct,
      limitPct: p.minMarginPct,
    }))
  );

  useEffect(() => {
    setQuotation(initialQuotation);
    setSaveSuccessMsg('');
  }, [initialQuotation]);

  if (!quotation) return null;

  // Helper to determine discount limit based on product category/name
  const getDiscountLimit = (item: QuotationItem) => {
    if (item.productName.includes('Setup') || item.productName.includes('Service')) return 10;
    if (item.productName.includes('Warranty') || item.productName.includes('Care')) return 15;
    return 15; // default hardware limit
  };

  // Calculate if any item exceeds discount limit
  const overlimitItems = quotation.items.filter((item) => {
    const limit = getDiscountLimit(item);
    return item.discountPct > limit;
  });

  const isDiscountOverlimit = overlimitItems.length > 0;

  // Recalculate quotation metrics
  const recalculateQuote = (updatedItems: QuotationItem[]): Quotation => {
    const subtotal = updatedItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const grandTotal = updatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
    const discountAmount = subtotal - grandTotal;
    const totalCogs = updatedItems.reduce((acc, i) => acc + i.cogs * i.quantity, 0);
    const marginPct = grandTotal > 0 ? ((grandTotal - totalCogs) / grandTotal) * 100 : 0;

    return {
      ...quotation,
      items: updatedItems,
      subtotal,
      discountAmount,
      grandTotal,
      totalCogs,
      marginPct: Number(marginPct.toFixed(1)),
    };
  };

  // Add suggestion item to quote
  const handleAddSuggestion = (sug: SuggestionItem) => {
    const gross = sug.price * 1;
    const discVal = (gross * sug.discountPct) / 100;
    const lineTotal = gross - discVal;
    const marginPct = ((lineTotal - sug.cogs) / lineTotal) * 100;

    const newItem: QuotationItem = {
      id: `qi-add-${Date.now()}`,
      productId: `prod-${sug.id}`,
      productName: sug.name,
      sku: `SKU-${sug.name.substring(0, 3).toUpperCase()}-01`,
      quantity: 1,
      unitPrice: sug.price,
      cogs: sug.cogs,
      discountPct: sug.discountPct,
      lineTotal,
      marginPct,
      isUpsellRecommendation: true,
    };

    const updatedItems = [...quotation.items, newItem];
    const newQuote = recalculateQuote(updatedItems);
    setQuotation(newQuote);

    // Remove from suggestions
    setSuggestions(suggestions.filter((s) => s.id !== sug.id));
    setSaveSuccessMsg(`Added ${sug.name} to proposal. Quotation total updated.`);
  };

  // Dismiss suggestion item
  const handleDismissSuggestion = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repReply.trim()) return;
    onSendSalesRepMessage(quotation.id, repReply);
    setRepReply('');
  };

  const handleSaveDraft = () => {
    setSaveSuccessMsg('Draft changes saved successfully.');
  };

  const handleSubmitForApproval = () => {
    onUpdateStatus(quotation.id, 'pending_approval');
    setSaveSuccessMsg('Quotation submitted for Manager Approval.');
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div
        className="drawer-panel"
        style={{
          width: '780px',
          background: 'rgba(9, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid var(--border-glass-light)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with B2B Context */}
        <div className="drawer-header" style={{ background: 'rgba(7, 17, 31, 0.9)', borderBottom: '1px solid var(--border-glass)' }}>
          <div className="drawer-title" style={{ color: '#f5f7fa', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={18} style={{ color: '#38d9ff' }} />
            <span className="font-mono" style={{ fontSize: '16px', fontWeight: 800 }}>{quotation.code}</span>
            <Badge status={quotation.status} />
          </div>
          <button style={{ color: '#9aa8ba' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body" style={{ padding: '20px' }}>
          {/* Header Context Summary (Quotation number, Customer, Price List) */}
          <div
            style={{
              background: 'rgba(15, 28, 48, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#9aa8ba', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Quotation Number
              </div>
              <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: '#38d9ff', marginTop: '2px' }}>
                {quotation.code}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#9aa8ba', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Customer Account
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#f5f7fa', marginTop: '2px' }}>
                {quotation.customerName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#9aa8ba', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Commercial Price List
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#31d38a', marginTop: '2px' }}>
                Enterprise Standard 2026
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {saveSuccessMsg && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(49, 211, 138, 0.15)',
                color: '#31d38a',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} /> {saveSuccessMsg}
            </div>
          )}

          {/* Restrained Warning when discount exceeds limit */}
          {isDiscountOverlimit && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(245, 181, 68, 0.12)',
                borderLeft: '4px solid #f5b544',
                borderRadius: '6px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertTriangle size={18} style={{ color: '#f5b544', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#f5b544' }}>
                  Discount Limit Exceeded
                </strong>
                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, marginTop: '2px' }}>
                  {overlimitItems.length} line item exceeds allowed delegation threshold ({overlimitItems.map((i) => `${i.productName}: ${i.discountPct}% requested vs ${getDiscountLimit(i)}% limit`).join(', ')}). Requires Manager Approval.
                </p>
              </div>
            </div>
          )}

          {/* DENSE QUOTATION TABLE (Product, Qty, Price, Discount, Limit, Status) */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                Quotation Line Items
              </h4>
              <span className="font-mono" style={{ fontSize: '12px', color: '#9aa8ba' }}>
                {quotation.items.length} Items Listed
              </span>
            </div>

            <div className="table-glass-wrapper">
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="number-cell">Qty</th>
                    <th className="number-cell">Price</th>
                    <th className="number-cell">Discount</th>
                    <th className="number-cell">Limit</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item) => {
                    const limit = getDiscountLimit(item);
                    const isOver = item.discountPct > limit;
                    const overPts = item.discountPct - limit;

                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f5f7fa' }}>{item.productName}</div>
                          <div className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>{item.sku}</div>
                        </td>
                        <td className="number-cell font-mono" style={{ fontWeight: 600 }}>
                          Qty {item.quantity}
                        </td>
                        <td className="number-cell font-mono" style={{ color: '#f5f7fa' }}>
                          ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </td>
                        <td className="number-cell font-mono" style={{ color: isOver ? '#f5b544' : '#f5f7fa', fontWeight: 600 }}>
                          {item.discountPct}%
                        </td>
                        <td className="number-cell font-mono" style={{ color: '#9aa8ba' }}>
                          {limit}%
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isOver ? (
                            <span
                              style={{
                                background: 'rgba(245, 181, 68, 0.2)',
                                color: '#f5b544',
                                border: '1px solid rgba(245, 181, 68, 0.4)',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              OVER (+{overPts}pt)
                            </span>
                          ) : (
                            <span
                              style={{
                                background: 'rgba(49, 211, 138, 0.15)',
                                color: '#31d38a',
                                border: '1px solid rgba(49, 211, 138, 0.3)',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary Box */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(7, 17, 31, 0.7)',
                border: '1px solid var(--border-glass)',
                padding: '12px 18px',
                borderRadius: '8px',
                marginTop: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9aa8ba' }}>
                Overall Margin:{' '}
                <strong className="font-mono" style={{ color: quotation.marginPct < 20 ? '#ff6b72' : '#31d38a', fontSize: '14px' }}>
                  {quotation.marginPct.toFixed(1)}%
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Quote Total:</span>
                <strong className="font-mono" style={{ fontSize: '20px', color: '#38d9ff', fontWeight: 800 }}>
                  ${quotation.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* UPSELL AND CROSS-SELL SUGGESTIONS */}
          {suggestions.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Sparkles size={15} style={{ color: '#38d9ff' }} />
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Upsell and Cross-Sell Suggestions
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    style={{
                      padding: '12px',
                      background: 'rgba(15, 28, 48, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#f5f7fa', display: 'block', marginBottom: '2px' }}>
                        {sug.name}
                      </strong>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                        <span className="font-mono" style={{ color: '#9aa8ba' }}>${sug.price}</span>
                        <span style={{ color: '#31d38a', fontWeight: 600, background: 'rgba(49, 211, 138, 0.12)', padding: '1px 6px', borderRadius: '4px' }}>
                          {sug.tag}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn-glass btn-glass-primary btn-sm"
                        style={{ flex: 1, padding: '3px 8px', fontSize: '11px', justifyContent: 'center' }}
                        onClick={() => handleAddSuggestion(sug)}
                      >
                        <Plus size={12} /> Add
                      </button>
                      <button
                        type="button"
                        className="btn-glass btn-glass-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={() => handleDismissSuggestion(sug.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Negotiation & Activity Audit Trail */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f5f7fa', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={15} style={{ color: '#38d9ff' }} />
              <span>Customer Negotiation & Activity Audit Trail</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {quotation.negotiationHistory.length === 0 ? (
                <div style={{ fontSize: '12px', color: '#9aa8ba', fontStyle: 'italic', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
                  No negotiation messages exchanged yet.
                </div>
              ) : (
                quotation.negotiationHistory.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      borderLeft: `3px solid ${msg.senderRole === 'customer' ? '#f5b544' : '#2f8cff'}`,
                      background: msg.senderRole === 'customer' ? 'rgba(245, 181, 68, 0.08)' : 'rgba(255,255,255,0.03)',
                      padding: '10px 12px',
                      borderRadius: '0 6px 6px 0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9aa8ba', marginBottom: '4px' }}>
                      <strong style={{ color: msg.senderRole === 'customer' ? '#f5b544' : '#38d9ff' }}>
                        {msg.senderName} ({msg.senderRole === 'customer' ? 'Customer' : 'Sales Operations Rep'})
                      </strong>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#f5f7fa' }}>{msg.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-glass-select"
                placeholder="Type response to negotiation thread..."
                value={repReply}
                onChange={(e) => setRepReply(e.target.value)}
                style={{ flex: 1, fontSize: '12px' }}
              />
              <button type="submit" className="btn-glass btn-glass-primary btn-sm">
                <Send size={13} /> Send
              </button>
            </form>
          </div>
        </div>

        {/* Drawer Footer with Required B2B Buttons (Save Draft, Submit for Approval) */}
        <div className="drawer-footer" style={{ background: 'rgba(7, 17, 31, 0.9)', borderTop: '1px solid var(--border-glass)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            className="btn-glass btn-glass-secondary btn-sm"
            onClick={() => {
              navigator.clipboard.writeText(`http://localhost:5173/portal/quote/${quotation.id}`);
              alert(`Customer portal link for ${quotation.code} copied to clipboard! Log in as customer to access the customer portal.`);
            }}
          >
            <ExternalLink size={13} /> Copy Customer Quote Link
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn-glass btn-glass-secondary"
              onClick={handleSaveDraft}
              style={{ fontWeight: 600 }}
            >
              Save Draft
            </button>

            <button
              className="btn-glass btn-glass-primary"
              onClick={handleSubmitForApproval}
              style={{ fontWeight: 600 }}
            >
              <Send size={14} /> Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

