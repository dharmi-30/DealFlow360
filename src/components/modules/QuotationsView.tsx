import React, { useState } from 'react';
import { Customer, Product, Quotation } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { QuotationCreateModal } from './QuotationCreateModal';
import { QuotationDrawer } from './QuotationDrawer';
import {
  Search,
  Plus,
  Filter,
  Download,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  LayoutGrid,
  List,
} from 'lucide-react';

interface QuotationsViewProps {
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  onCreateQuotation: (newQuotation: Quotation) => void;
  onUpdateStatus: (quotationId: string, newStatus: Quotation['status']) => void;
  onOpenCustomerPortal: (quotationId: string) => void;
  onSendSalesRepMessage: (quotationId: string, message: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  quotations,
  customers,
  products,
  onCreateQuotation,
  onUpdateStatus,
  onOpenCustomerPortal,
  onSendSalesRepMessage,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'table' | 'kanban'>('kanban');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Filtering
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.salesRep.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || q.customerId === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const handleSaveModal = (newQuotation: Quotation) => {
    onCreateQuotation(newQuotation);
    setIsCreateModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['Quotation Code', 'Customer', 'Sales Rep', 'Grand Total', 'Margin %', 'Status', 'Created Date'];
    const rows = filteredQuotations.map((q) => [
      q.code,
      `"${q.customerName}"`,
      `"${q.salesRep}"`,
      q.grandTotal.toFixed(2),
      `${q.marginPct}%`,
      q.status,
      q.createdDate,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `dealflow360_quotations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kanbanColumns = [
    { id: 'draft', label: 'Draft' },
    { id: 'pending_approval', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved' },
    { id: 'customer_countered', label: 'Negotiation' },
    { id: 'accepted', label: 'Confirmed' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Quotations & Commercial Proposals</h1>
          <p className="page-subheading">
            Manage quotation lifecycles, margin guardrails, and customer negotiation proposals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-glass btn-glass-secondary" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn-glass btn-glass-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={15} /> Create Quotation
          </button>
        </div>
      </div>

      {/* Filter and View Layout Toolbar */}
      <div className="filter-glass-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="header-search-bar" style={{ width: '280px' }}>
            <Search size={14} style={{ color: '#38d9ff' }} />
            <input
              type="text"
              placeholder="Search code, customer, rep..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Status:</span>
            <select
              className="input-glass-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({quotations.length})</option>
              <option value="draft">Draft</option>
              <option value="pending_approval">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="customer_countered">Customer Countered</option>
              <option value="fulfilled">Fulfilled</option>
            </select>

            <select
              className="input-glass-select"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option value="all">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle (Table vs Kanban) */}
        <div style={{ display: 'flex', background: 'rgba(7, 17, 31, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px' }}>
          <button
            onClick={() => setViewLayout('table')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              background: viewLayout === 'table' ? '#2f8cff' : 'transparent',
              color: viewLayout === 'table' ? '#fff' : '#9aa8ba',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <List size={13} /> Table
          </button>
          <button
            onClick={() => setViewLayout('kanban')}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 600,
              background: viewLayout === 'kanban' ? '#2f8cff' : 'transparent',
              color: viewLayout === 'kanban' ? '#fff' : '#9aa8ba',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <LayoutGrid size={13} /> Kanban
          </button>
        </div>
      </div>

      {/* Main Content Layout (Table vs Kanban) */}
      {filteredQuotations.length === 0 ? (
        <EmptyState
          isFilter={searchTerm !== '' || statusFilter !== 'all' || customerFilter !== 'all'}
          title="No quotations found"
          description="Try broadening your search criteria or create a new quotation proposal."
          actionText="Create Quotation"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewLayout === 'table' ? (
        <div className="table-glass-wrapper">
          <table className="table-glass">
            <thead>
              <tr>
                <th>Quote Code</th>
                <th>Customer Account</th>
                <th>Assigned Rep</th>
                <th className="number-cell">Line Items</th>
                <th className="number-cell">Grand Total</th>
                <th className="number-cell">Margin %</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map((q) => (
                <tr
                  key={q.id}
                  className="clickable"
                  onClick={() => setSelectedQuotation(q)}
                >
                  <td className="font-mono" style={{ fontWeight: 700, color: '#2f8cff' }}>
                    {q.code}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#f5f7fa' }}>{q.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{q.customerContact}</div>
                  </td>
                  <td>{q.salesRep}</td>
                  <td className="number-cell font-mono">{q.items.length} items</td>
                  <td className="number-cell font-mono" style={{ fontWeight: 700 }}>
                    ${q.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td
                    className="number-cell font-mono"
                    style={{
                      fontWeight: 600,
                      color: q.marginPct < 20 ? '#ff6b72' : '#31d38a',
                    }}
                  >
                    {q.marginPct.toFixed(1)}%
                  </td>
                  <td>
                    <Badge status={q.status} />
                  </td>
                  <td style={{ fontSize: '12px', color: '#9aa8ba' }}>{q.validUntil}</td>
                  <td>
                    <ChevronRight size={16} style={{ color: '#64748b' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {kanbanColumns.map((col) => {
            const colQuotes = filteredQuotations.filter((q) => q.status === col.id || (col.id === 'accepted' && q.status === 'fulfilled'));

            return (
              <div
                key={col.id}
                style={{
                  background: 'rgba(15, 28, 48, 0.4)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '14px',
                  minHeight: '480px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700, color: '#f5f7fa' }}>
                  <span>{col.label}</span>
                  <span style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '10px', color: '#9aa8ba' }}>
                    {colQuotes.length}
                  </span>
                </div>

                {colQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="glass-card"
                    style={{ padding: '12px', cursor: 'pointer' }}
                    onClick={() => setSelectedQuotation(q)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <strong className="font-mono" style={{ color: '#2f8cff' }}>{q.code}</strong>
                      <Badge status={q.status} />
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5f7fa' }}>{q.customerName}</div>
                    <div style={{ fontSize: '11px', color: '#9aa8ba', marginTop: '2px' }}>{q.salesRep}</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: '#38d9ff' }}>
                        ${q.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                      </span>
                      <span style={{ fontSize: '11px', color: q.marginPct < 20 ? '#ff6b72' : '#31d38a', fontWeight: 600 }}>
                        {q.marginPct.toFixed(1)}% margin
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <QuotationCreateModal
          customers={customers}
          products={products}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleSaveModal}
        />
      )}

      {/* Slide-over Inspection Drawer */}
      <QuotationDrawer
        quotation={selectedQuotation}
        products={products}
        onClose={() => setSelectedQuotation(null)}
        onUpdateStatus={(id, status) => {
          onUpdateStatus(id, status);
          if (selectedQuotation && selectedQuotation.id === id) {
            setSelectedQuotation({ ...selectedQuotation, status });
          }
        }}
        onOpenCustomerPortal={(id) => {
          setSelectedQuotation(null);
          onOpenCustomerPortal(id);
        }}
        onSendSalesRepMessage={(id, msg) => {
          onSendSalesRepMessage(id, msg);
          if (selectedQuotation && selectedQuotation.id === id) {
            const updatedHistory = [
              ...selectedQuotation.negotiationHistory,
              {
                id: `msg-${Date.now()}`,
                quotationId: id,
                senderRole: 'sales_rep' as const,
                senderName: selectedQuotation.salesRep,
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
                message: msg,
              },
            ];
            setSelectedQuotation({ ...selectedQuotation, negotiationHistory: updatedHistory });
          }
        }}
      />
    </div>
  );
};
