import React, { useState, useEffect } from 'react';
import { Quotation, Customer, Product, ModuleType } from '../../types';
import { Search, FileText, Building2, Package, X, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  onSelectQuotation: (q: Quotation) => void;
  onSelectModule: (module: ModuleType) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  quotations,
  customers,
  products,
  onSelectQuotation,
  onSelectModule,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedQuotes = quotations.filter(
    (q) =>
      q.code.toLowerCase().includes(query.toLowerCase()) ||
      q.customerName.toLowerCase().includes(query.toLowerCase()) ||
      q.salesRep.toLowerCase().includes(query.toLowerCase())
  );

  const matchedCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase())
  );

  const matchedProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-input-wrap">
          <Search size={18} style={{ color: '#38d9ff' }} />
          <input
            type="text"
            autoFocus
            placeholder="Search quotations, customers, products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ color: '#9aa8ba' }}>
            <X size={16} />
          </button>
        </div>

        <div className="search-modal-results">
          {/* Quick Shortcuts */}
          {!query && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                Navigation Shortcuts
              </div>
              <div
                className="search-modal-item"
                onClick={() => {
                  onSelectModule('dashboard');
                  onClose();
                }}
              >
                <span>Go to Executive Dashboard</span>
                <ArrowRight size={13} style={{ color: '#2f8cff' }} />
              </div>
              <div
                className="search-modal-item"
                onClick={() => {
                  onSelectModule('quotations');
                  onClose();
                }}
              >
                <span>View All Quotations & Proposals</span>
                <ArrowRight size={13} style={{ color: '#2f8cff' }} />
              </div>
              <div
                className="search-modal-item"
                onClick={() => {
                  onSelectModule('approvals');
                  onClose();
                }}
              >
                <span>Open Multi-Tier Approval Queue</span>
                <ArrowRight size={13} style={{ color: '#2f8cff' }} />
              </div>
            </div>
          )}

          {/* Matched Quotations */}
          {matchedQuotes.length > 0 && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                Quotations ({matchedQuotes.length})
              </div>
              {matchedQuotes.map((q) => (
                <div
                  key={q.id}
                  className="search-modal-item"
                  onClick={() => {
                    onSelectQuotation(q);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={15} style={{ color: '#2f8cff' }} />
                    <strong className="font-mono">{q.code}</strong>
                    <span style={{ color: '#9aa8ba' }}>{q.customerName}</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: 700, color: '#38d9ff' }}>
                    ${q.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matched Customers */}
          {matchedCustomers.length > 0 && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                Customer Accounts
              </div>
              {matchedCustomers.map((c) => (
                <div key={c.id} className="search-modal-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Building2 size={15} style={{ color: '#8b5cf6' }} />
                    <strong>{c.name}</strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>({c.code})</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#9aa8ba' }}>{c.tier} Tier</span>
                </div>
              ))}
            </div>
          )}

          {/* Matched Products */}
          {matchedProducts.length > 0 && (
            <div style={{ padding: '8px 12px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>
                Products
              </div>
              {matchedProducts.map((p) => (
                <div key={p.id} className="search-modal-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Package size={15} style={{ color: '#31d38a' }} />
                    <strong>{p.name}</strong>
                    <span className="font-mono" style={{ fontSize: '11px', color: '#64748b' }}>{p.sku}</span>
                  </div>
                  <span className="font-mono" style={{ fontWeight: 600 }}>${p.listPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
