import React, { useState } from 'react';
import { Customer, Product, Quotation, QuotationItem, WarehouseHub } from '../../types';
import { X, Plus, Trash2, AlertTriangle, Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface SuggestionItem {
  id: string;
  name: string;
  price: number;
  cogs: number;
  tag: string;
  discountPct: number;
  limitPct: number;
}

interface QuotationCreateModalProps {
  customers: Customer[];
  products: Product[];
  onClose: () => void;
  onSave: (newQuotation: Quotation) => void;
}

export const QuotationCreateModal: React.FC<QuotationCreateModalProps> = ({
  customers,
  products,
  onClose,
  onSave,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [salesRep, setSalesRep] = useState<string>('Sarah Jenkins');
  const [priceList, setPriceList] = useState<string>('Enterprise Standard 2026');
  const [warehouseHub, setWarehouseHub] = useState<WarehouseHub>('Dallas (HUB-01)');
  const [validUntil, setValidUntil] = useState<string>('2026-10-15');

  // Exact sample items from prompt
  const [items, setItems] = useState<QuotationItem[]>([
    {
      id: 'qi-builder-1',
      productId: 'prod-1',
      productName: 'Laptop Pro 14',
      sku: 'HW-LTP-14',
      quantity: 2,
      unitPrice: 1200.0,
      cogs: 800.0,
      discountPct: 12.0,
      lineTotal: 2112.0,
      marginPct: 24.2,
    },
    {
      id: 'qi-builder-2',
      productId: 'prod-2',
      productName: 'Onsite Setup Service',
      sku: 'SV-ONSITE-SET',
      quantity: 1,
      unitPrice: 450.0,
      cogs: 180.0,
      discountPct: 18.0,
      lineTotal: 369.0,
      marginPct: 51.2,
    },
    {
      id: 'qi-builder-3',
      productId: 'prod-3',
      productName: 'Extended Warranty',
      sku: 'HW-EXT-WRN',
      quantity: 1,
      unitPrice: 180.0,
      cogs: 95.0,
      discountPct: 10.0,
      lineTotal: 162.0,
      marginPct: 41.4,
    },
  ]);

  // Suggestions state derived dynamically from schema.sql products
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

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const getDiscountLimit = (productName: string) => {
    if (productName.includes('Setup') || productName.includes('Service')) return 10;
    if (productName.includes('Warranty') || productName.includes('Care')) return 15;
    return 15;
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
    value: number | string
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        item.productId = prod.id;
        item.productName = prod.name;
        item.sku = prod.sku;
        item.unitPrice = prod.listPrice;
        item.cogs = prod.cogs;
        item.discountPct = prod.defaultDiscountPct;
      }
    } else if (field === 'quantity') {
      item.quantity = Math.max(1, Number(value));
    } else if (field === 'discountPct') {
      item.discountPct = Math.min(100, Math.max(0, Number(value)));
    } else if (field === 'unitPrice') {
      item.unitPrice = Math.max(0, Number(value));
    }

    const grossPrice = item.unitPrice * item.quantity;
    const discountVal = (grossPrice * item.discountPct) / 100;
    item.lineTotal = grossPrice - discountVal;
    const itemTotalCogs = item.cogs * item.quantity;
    item.marginPct = item.lineTotal > 0 ? ((item.lineTotal - itemTotalCogs) / item.lineTotal) * 100 : 0;

    updated[index] = item;
    setItems(updated);
  };

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

    setItems([...items, newItem]);
    setSuggestions(suggestions.filter((s) => s.id !== sug.id));
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions(suggestions.filter((s) => s.id !== id));
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddNewLineItem = () => {
    const availableProd = products.find((p) => !items.some((i) => i.productId === p.id)) || products[0];
    if (!availableProd) return;

    const grossPrice = availableProd.listPrice * 1;
    const discountVal = (grossPrice * availableProd.defaultDiscountPct) / 100;
    const lineTotal = grossPrice - discountVal;
    const itemTotalCogs = availableProd.cogs * 1;
    const marginPct = lineTotal > 0 ? ((lineTotal - itemTotalCogs) / lineTotal) * 100 : 0;

    const newItem: QuotationItem = {
      id: `qi-new-${Date.now()}-${items.length + 1}`,
      productId: availableProd.id,
      productName: availableProd.name,
      sku: availableProd.sku,
      quantity: 1,
      unitPrice: availableProd.listPrice,
      cogs: availableProd.cogs,
      discountPct: availableProd.defaultDiscountPct,
      lineTotal,
      marginPct,
    };

    setItems((prev) => [...prev, newItem]);
  };

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const grandTotal = items.reduce((acc, item) => acc + item.lineTotal, 0);
  const discountAmount = subtotal - grandTotal;
  const totalCogs = items.reduce((acc, item) => acc + item.cogs * item.quantity, 0);
  const totalMarginPct = grandTotal > 0 ? ((grandTotal - totalCogs) / grandTotal) * 100 : 0;

  // Check overlimit items
  const overlimitItems = items.filter((item) => {
    const limit = getDiscountLimit(item.productName);
    return item.discountPct > limit;
  });
  const hasOverlimit = overlimitItems.length > 0;

  const handleSaveDraft = () => {
    const newCode = `Q-${Math.floor(1000 + Math.random() * 9000)}`;
    const newQuotation: Quotation = {
      id: `q-${Date.now()}`,
      code: newCode,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerContact: selectedCustomer.contactName,
      customerEmail: selectedCustomer.contactEmail,
      items,
      subtotal,
      discountAmount,
      grandTotal,
      totalCogs,
      marginPct: Number(totalMarginPct.toFixed(1)),
      status: 'draft',
      requiresApproval: hasOverlimit,
      approvalReason: hasOverlimit
        ? `Discount on ${overlimitItems.map((i) => i.productName).join(', ')} exceeds allowed delegation limit.`
        : undefined,
      createdDate: new Date().toISOString().split('T')[0],
      validUntil,
      salesRep,
      warehouseHub,
      negotiationHistory: [],
    };

    onSave(newQuotation);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCode = `Q-${Math.floor(1000 + Math.random() * 9000)}`;

    const newQuotation: Quotation = {
      id: `q-${Date.now()}`,
      code: newCode,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerContact: selectedCustomer.contactName,
      customerEmail: selectedCustomer.contactEmail,
      items,
      subtotal,
      discountAmount,
      grandTotal,
      totalCogs,
      marginPct: Number(totalMarginPct.toFixed(1)),
      status: hasOverlimit ? 'pending_approval' : 'approved',
      requiresApproval: hasOverlimit,
      approvalReason: hasOverlimit
        ? `Discount on ${overlimitItems.map((i) => i.productName).join(', ')} exceeds allowed delegation limit.`
        : undefined,
      createdDate: new Date().toISOString().split('T')[0],
      validUntil,
      salesRep,
      warehouseHub,
      negotiationHistory: [],
    };

    onSave(newQuotation);
  };

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-box" style={{ width: '840px' }} onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-input-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>Quotation Builder</h2>
            <span className="badge-glass badge-glass-neutral">Commercial Workspace</span>
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
            title="Close Quotation Builder"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
            {/* Top Grid: Customer, Price List, Sales Rep */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Customer Account *</label>
                <select
                  className="input-glass-select"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Price List *</label>
                <select
                  className="input-glass-select"
                  value={priceList}
                  onChange={(e) => setPriceList(e.target.value)}
                >
                  <option value="Enterprise Standard 2026">Enterprise Standard 2026</option>
                  <option value="Strategic Tier 2026">Strategic Tier 2026</option>
                  <option value="Government & Edu 2026">Government & Edu 2026</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Sales Representative</label>
                <input
                  type="text"
                  className="input-glass-select"
                  value={salesRep}
                  onChange={(e) => setSalesRep(e.target.value)}
                />
              </div>
            </div>

            {/* Restrained Warning Callout when discount exceeds limit */}
            {hasOverlimit && (
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
                    Discount Limit Warning
                  </strong>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, marginTop: '2px' }}>
                    {overlimitItems.length} line item exceeds standard rep discount limit ({overlimitItems.map((i) => `${i.productName}: ${i.discountPct}% vs ${getDiscountLimit(i.productName)}% limit`).join(', ')}). Requires Manager Approval.
                  </p>
                </div>
              </div>
            )}

            {/* DENSE QUOTATION TABLE (Product, Qty, Price, Discount, Limit, Status) */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f5f7fa' }}>Line Items Ledger</span>
                <button type="button" className="btn-glass btn-glass-secondary btn-sm" onClick={handleAddNewLineItem}>
                  <Plus size={14} /> Add Line Item
                </button>
              </div>

              <div className="table-glass-wrapper">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th style={{ width: '32%' }}>Product</th>
                      <th style={{ width: '10%' }} className="number-cell">Qty</th>
                      <th style={{ width: '14%' }} className="number-cell">Price</th>
                      <th style={{ width: '14%' }} className="number-cell">Discount</th>
                      <th style={{ width: '10%' }} className="number-cell">Limit</th>
                      <th style={{ width: '14%', textAlign: 'center' }}>Status</th>
                      <th style={{ width: '6%', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const limit = getDiscountLimit(item.productName);
                      const isOver = item.discountPct > limit;
                      const overPts = item.discountPct - limit;

                      return (
                        <tr key={item.id}>
                          <td>
                            <select
                              className="input-glass-select"
                              value={item.productId}
                              onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                              style={{ padding: '4px 6px', fontSize: '12px', width: '100%', color: '#f5f7fa', fontWeight: 600 }}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (${p.listPrice.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="number-cell font-mono">
                            <input
                              type="number"
                              min="1"
                              className="input-glass-select"
                              style={{ padding: '4px 6px', fontSize: '12px', width: '56px', textAlign: 'right' }}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            />
                          </td>
                          <td className="number-cell font-mono" style={{ color: '#f5f7fa' }}>
                            ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                          </td>
                          <td className="number-cell font-mono">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              className="input-glass-select"
                              style={{
                                padding: '4px 6px',
                                fontSize: '12px',
                                width: '64px',
                                textAlign: 'right',
                                color: isOver ? '#f5b544' : '#f5f7fa',
                                borderColor: isOver ? '#f5b544' : 'var(--border-glass-light)',
                              }}
                              value={item.discountPct}
                              onChange={(e) => handleItemChange(idx, 'discountPct', e.target.value)}
                            />
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
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={items.length <= 1}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: items.length > 1 ? '#ff6b72' : '#64748b',
                                cursor: items.length > 1 ? 'pointer' : 'not-allowed',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: items.length > 1 ? 1 : 0.4,
                              }}
                              title={items.length > 1 ? 'Remove Line Item' : 'At least 1 line item is required'}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* UPSELL AND CROSS-SELL SUGGESTIONS */}
            {suggestions.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <Sparkles size={14} style={{ color: '#38d9ff' }} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f5f7fa' }}>
                    Upsell and Cross-Sell Suggestions
                  </span>
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

            {/* Financial Summary Box */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(7, 17, 31, 0.8)',
                border: '1px solid var(--border-glass)',
                padding: '14px 20px',
                borderRadius: '8px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#9aa8ba' }}>
                Overall Margin:{' '}
                <strong className="font-mono" style={{ color: totalMarginPct < 20 ? '#ff6b72' : '#31d38a', fontSize: '15px' }}>
                  {totalMarginPct.toFixed(1)}%
                </strong>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Grand Total:</span>
                <strong className="font-mono" style={{ color: '#38d9ff', fontSize: '20px', fontWeight: 800 }}>
                  ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons (Save Draft, Submit for Approval) */}
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-glass btn-glass-secondary" onClick={handleSaveDraft}>
              Save Draft
            </button>
            <button type="submit" className="btn-glass btn-glass-primary">
              <Check size={15} />
              Submit for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

