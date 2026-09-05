import React, { useState, useMemo } from 'react';
import { FulfillmentRecord, FulfillmentStatus, WarehouseInventoryRecord } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import {
  Truck,
  Warehouse,
  CheckCircle2,
  Edit2,
  X,
  Box,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Package,
} from 'lucide-react';

interface FulfillmentViewProps {
  fulfillments: FulfillmentRecord[];
  onUpdateFulfillment: (recordId: string, status: FulfillmentStatus, carrier?: string, tracking?: string) => void;
  inventoryRecords?: WarehouseInventoryRecord[];
  onUpdateStock?: (inventoryId: string, newQuantity: number, newReservedQty: number) => void;
}

export const FulfillmentView: React.FC<FulfillmentViewProps> = ({
  fulfillments,
  onUpdateFulfillment,
  inventoryRecords = [],
  onUpdateStock,
}) => {
  // Tab Switcher State: 'inventory' | 'dispatches'
  const [activeTab, setActiveTab] = useState<'inventory' | 'dispatches'>('inventory');

  // Dispatch Tab State
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [editingDispatchRecord, setEditingDispatchRecord] = useState<FulfillmentRecord | null>(null);
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusInput, setStatusInput] = useState<FulfillmentStatus>('dispatched');

  // Inventory Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [invWarehouseFilter, setInvWarehouseFilter] = useState('all');
  const [invStatusFilter, setInvStatusFilter] = useState('all');
  const [invCategoryFilter, setInvCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Editing Inventory Stock Modal State
  const [editingStockItem, setEditingStockItem] = useState<WarehouseInventoryRecord | null>(null);
  const [editTotalQuantity, setEditTotalQuantity] = useState<number>(0);
  const [editReservedQuantity, setEditReservedQuantity] = useState<number>(0);

  // Filtered Dispatches
  const pendingPicks = fulfillments.filter((f) => f.status === 'pending_pick' || f.status === 'packing');
  const filteredFulfillments = fulfillments.filter((f) => {
    if (selectedHub === 'all') return true;
    return f.warehouseHub.toLowerCase().includes(selectedHub.toLowerCase());
  });

  // Unique categories for inventory dropdown filter
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    inventoryRecords.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [inventoryRecords]);

  // Inventory Analytics KPIs
  const totalSKUs = inventoryRecords.length;
  const totalStockVolume = useMemo(() => inventoryRecords.reduce((sum, i) => sum + (i.quantity || 0), 0), [inventoryRecords]);
  const totalReservedVolume = useMemo(() => inventoryRecords.reduce((sum, i) => sum + (i.reservedQuantity || 0), 0), [inventoryRecords]);
  const totalAvailableVolume = useMemo(() => inventoryRecords.reduce((sum, i) => sum + (i.availableStock || 0), 0), [inventoryRecords]);

  // Filtered Inventory List
  const filteredInventory = useMemo(() => {
    return inventoryRecords.filter((item) => {
      // Search match
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.productName.toLowerCase().includes(query) ||
        item.sku.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.warehouseName.toLowerCase().includes(query);

      // Warehouse match
      const matchesWarehouse =
        invWarehouseFilter === 'all' ||
        item.warehouseName.toLowerCase().includes(invWarehouseFilter.toLowerCase()) ||
        item.warehouseId.toLowerCase().includes(invWarehouseFilter.toLowerCase());

      // Status match
      const matchesStatus =
        invStatusFilter === 'all' ||
        (invStatusFilter === 'In Stock' && item.status === 'In Stock') ||
        (invStatusFilter === 'Low Stock' && item.status === 'Low Stock') ||
        (invStatusFilter === 'Critical' && item.status === 'Critical');

      // Category match
      const matchesCategory =
        invCategoryFilter === 'all' || item.category.toLowerCase() === invCategoryFilter.toLowerCase();

      return matchesSearch && matchesWarehouse && matchesStatus && matchesCategory;
    });
  }, [inventoryRecords, searchQuery, invWarehouseFilter, invStatusFilter, invCategoryFilter]);

  // Pagination for Inventory
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Reset pagination on filter change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Handlers for Dispatch Modal
  const handleOpenDispatchModal = (record: FulfillmentRecord) => {
    setEditingDispatchRecord(record);
    setCarrierInput(record.carrier || 'FedEx Freight Direct');
    setTrackingInput(record.trackingNumber || `FX-${Math.floor(10000000 + Math.random() * 90000000)}-US`);
    setStatusInput(record.status);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDispatchRecord) return;
    onUpdateFulfillment(editingDispatchRecord.id, statusInput, carrierInput, trackingInput);
    setEditingDispatchRecord(null);
  };

  // Handlers for Stock Adjustment Modal
  const handleOpenStockModal = (item: WarehouseInventoryRecord) => {
    setEditingStockItem(item);
    setEditTotalQuantity(item.quantity);
    setEditReservedQuantity(item.reservedQuantity);
  };

  const handleSaveStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockItem || !onUpdateStock) return;
    onUpdateStock(editingStockItem.id, Number(editTotalQuantity), Number(editReservedQuantity));
    setEditingStockItem(null);
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Page Header */}
      <div className="page-header-row" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, letterSpacing: '0.05em' }}>
              Logistics & Fulfillment
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Multi-Hub Inventory Split Engine (schema.sql)</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
            Fulfillment Operations & Stocks Management
          </h1>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(7, 17, 31, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'inventory' ? 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)' : 'transparent',
              color: activeTab === 'inventory' ? '#ffffff' : '#9aa8ba',
              boxShadow: activeTab === 'inventory' ? '0 4px 12px rgba(47, 140, 255, 0.3)' : 'none',
            }}
          >
            <Warehouse size={15} />
            Stock & Inventory
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: activeTab === 'inventory' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: activeTab === 'inventory' ? '#fff' : '#9aa8ba',
              }}
            >
              {totalSKUs} SKUs
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispatches')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'dispatches' ? 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)' : 'transparent',
              color: activeTab === 'dispatches' ? '#ffffff' : '#9aa8ba',
              boxShadow: activeTab === 'dispatches' ? '0 4px 12px rgba(47, 140, 255, 0.3)' : 'none',
            }}
          >
            <Truck size={15} />
            Freight Dispatches
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '10px',
                background: activeTab === 'dispatches' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                color: activeTab === 'dispatches' ? '#fff' : '#9aa8ba',
              }}
            >
              {fulfillments.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STOCK & INVENTORY MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <>
          {/* Top Analytics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div className="glass-panel" style={{ marginBottom: 0, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Total Catalog SKUs</span>
                <Package size={18} style={{ color: '#2f8cff' }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f5f7fa', fontFamily: 'monospace' }}>
                {totalSKUs.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#38d9ff', marginTop: '4px', fontWeight: 600 }}>
                Across 4 Regional Hubs (schema.sql)
              </div>
            </div>

            <div className="glass-panel" style={{ marginBottom: 0, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Total Physical Volume</span>
                <Warehouse size={18} style={{ color: '#38d9ff' }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f5f7fa', fontFamily: 'monospace' }}>
                {totalStockVolume.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#9aa8ba', marginTop: '4px' }}>
                On-hand physical stock quantity
              </div>
            </div>

            <div className="glass-panel" style={{ marginBottom: 0, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Reserved Stock</span>
                <Box size={18} style={{ color: '#f5b544' }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#f5b544', fontFamily: 'monospace' }}>
                {totalReservedVolume.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#9aa8ba', marginTop: '4px' }}>
                Allocated to pending quote orders
              </div>
            </div>

            <div className="glass-panel" style={{ marginBottom: 0, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Available Dispatch Stock</span>
                <CheckCircle2 size={18} style={{ color: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#22c55e', fontFamily: 'monospace' }}>
                {totalAvailableVolume.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: 600 }}>
                Unreserved free stock ready for sale
              </div>
            </div>
          </div>

          {/* Inventory Controls Toolbar */}
          <div className="glass-panel" style={{ marginBottom: '20px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Search Bar */}
              <div style={{ position: 'relative', flex: '1 1 280px', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9aa8ba' }} />
                <input
                  type="text"
                  className="input-glass-select"
                  placeholder="Search product name, SKU, category, or hub..."
                  value={searchQuery}
                  onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleFilterChange(setSearchQuery, '')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9aa8ba', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Warehouse Hub Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Warehouse size={15} style={{ color: '#38d9ff' }} />
                <select
                  className="input-glass-select"
                  value={invWarehouseFilter}
                  onChange={(e) => handleFilterChange(setInvWarehouseFilter, e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="all">All Warehouses (4)</option>
                  <option value="Dallas">Dallas Hub (HUB-01)</option>
                  <option value="Chicago">Chicago Hub (HUB-02)</option>
                  <option value="Frankfurt">Frankfurt Hub (HUB-03)</option>
                  <option value="Tokyo">Tokyo Hub (HUB-04)</option>
                </select>
              </div>

              {/* Stock Status Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={15} style={{ color: '#9aa8ba' }} />
                <select
                  className="input-glass-select"
                  value={invStatusFilter}
                  onChange={(e) => handleFilterChange(setInvStatusFilter, e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="all">All Stock Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Low Stock">Low Stock (&lt;20)</option>
                  <option value="Critical">Critical (0 units)</option>
                </select>
              </div>

              {/* Category Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={15} style={{ color: '#9aa8ba' }} />
                <select
                  className="input-glass-select"
                  value={invCategoryFilter}
                  onChange={(e) => handleFilterChange(setInvCategoryFilter, e.target.value)}
                  style={{ width: '190px' }}
                >
                  <option value="all">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(searchQuery || invWarehouseFilter !== 'all' || invStatusFilter !== 'all' || invCategoryFilter !== 'all') && (
                <button
                  className="btn-glass btn-glass-secondary btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setInvWarehouseFilter('all');
                    setInvStatusFilter('all');
                    setInvCategoryFilter('all');
                    setCurrentPage(1);
                  }}
                  style={{ gap: '6px' }}
                >
                  <RefreshCw size={13} /> Reset
                </button>
              )}
            </div>
          </div>

          {/* Stock Inventory Table */}
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Real-Time Warehouse Stock Ledger
                </h3>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
                  Live units on-hand, reserved allocations, and available stock per SKU &amp; hub
                </span>
              </div>

              <span style={{ fontSize: '12px', color: '#38d9ff', fontWeight: 600 }}>
                Showing {filteredInventory.length} of {inventoryRecords.length} Stock Records
              </span>
            </div>

            {filteredInventory.length === 0 ? (
              <EmptyState
                title="No inventory records found"
                description="No warehouse stock items match your search or filter parameters."
              />
            ) : (
              <>
                <div className="table-glass-wrapper">
                  <table className="table-glass">
                    <thead>
                      <tr>
                        <th>Warehouse Hub</th>
                        <th>Product SKU</th>
                        <th>Product Name &amp; Category</th>
                        <th>Unit</th>
                        <th className="number-cell">Total Qty</th>
                        <th className="number-cell">Reserved Qty</th>
                        <th className="number-cell">Available Stock</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInventory.map((item) => {
                        const statusColor =
                          item.status === 'In Stock'
                            ? '#22c55e'
                            : item.status === 'Low Stock'
                            ? '#f5b544'
                            : '#ef4444';

                        const statusBg =
                          item.status === 'In Stock'
                            ? 'rgba(34, 197, 94, 0.12)'
                            : item.status === 'Low Stock'
                            ? 'rgba(245, 181, 68, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)';

                        return (
                          <tr key={item.id}>
                            <td>
                              <div style={{ fontWeight: 700, color: '#f5f7fa', fontSize: '13px' }}>
                                {item.warehouseName}
                              </div>
                              <div style={{ fontSize: '11px', color: '#9aa8ba' }}>{item.location}</div>
                            </td>
                            <td className="font-mono" style={{ fontWeight: 700, color: '#2f8cff' }}>
                              {item.sku}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#f5f7fa', fontSize: '13px' }}>{item.productName}</div>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: '#9aa8ba',
                                  fontWeight: 500,
                                }}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: '#9aa8ba', textTransform: 'lowercase' }}>
                                {item.unitOfMeasure || 'units'}
                              </span>
                            </td>
                            <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#f5f7fa' }}>
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="number-cell font-mono" style={{ color: item.reservedQuantity > 0 ? '#f5b544' : '#9aa8ba' }}>
                              {item.reservedQuantity.toLocaleString()}
                            </td>
                            <td
                              className="number-cell font-mono"
                              style={{
                                fontWeight: 800,
                                fontSize: '14px',
                                color: item.availableStock > 0 ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {item.availableStock.toLocaleString()}
                            </td>
                            <td>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: statusColor,
                                  background: statusBg,
                                  padding: '3px 8px',
                                  borderRadius: '12px',
                                  border: `1px solid ${statusColor}33`,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {item.status === 'Critical' && <AlertTriangle size={11} />}
                                {item.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn-glass btn-glass-secondary btn-sm"
                                onClick={() => handleOpenStockModal(item)}
                              >
                                <Edit2 size={13} /> Adjust Stock
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-glass)',
                  }}
                >
                  <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredInventory.length)} of {filteredInventory.length}{' '}
                    stock records
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      className="btn-glass btn-glass-secondary btn-sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>

                    <span style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600, padding: '0 8px' }}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      className="btn-glass btn-glass-secondary btn-sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FREIGHT DISPATCHES & CARRIER LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'dispatches' && (
        <>
          {/* Header Warehouse Selection */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <select
              className="input-glass-select"
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="all">All Regional Warehouses</option>
              <option value="Dallas">Dallas (HUB-01)</option>
              <option value="Chicago">Chicago (HUB-02)</option>
              <option value="Frankfurt">Frankfurt (HUB-03)</option>
            </select>
          </div>

          {/* Orders Awaiting Fulfillment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-panel" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Box size={16} style={{ color: '#f5b544' }} />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                    Orders Awaiting Fulfillment
                  </h3>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#f5b544',
                    background: 'rgba(245, 181, 68, 0.15)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                  }}
                >
                  {pendingPicks.length} Pending Picks
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingPicks.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#9aa8ba' }}>All current quotation orders have been released to fulfillment dispatches.</p>
                ) : (
                  pendingPicks.map((order) => (
                    <div
                      key={order.id}
                      style={{
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="font-mono" style={{ fontSize: '14px', fontWeight: 800, color: '#2f8cff' }}>
                          {order.quotationCode}
                        </span>
                        <Badge status={order.status} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '13px', color: '#f5f7fa' }}>{order.customerName}</strong>
                        <span style={{ fontSize: '12px', color: '#9aa8ba' }}>{order.warehouseHub}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Warehouse Status Overview */}
            <div className="glass-panel" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Warehouse size={16} style={{ color: '#38d9ff' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Regional Hub Allocation Status
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(7, 17, 31, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#f5f7fa', fontSize: '13px' }}>Dallas Warehouse (HUB-01)</strong>
                  <p style={{ fontSize: '12px', color: '#9aa8ba', margin: '4px 0 0 0' }}>Allocated for US South &amp; West regional dispatches.</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(7, 17, 31, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#f5f7fa', fontSize: '13px' }}>Chicago Warehouse (HUB-02)</strong>
                  <p style={{ fontSize: '12px', color: '#9aa8ba', margin: '4px 0 0 0' }}>Allocated for US Midwest &amp; East Coast shipments.</p>
                </div>
                <div style={{ padding: '12px', background: 'rgba(7, 17, 31, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <strong style={{ color: '#f5f7fa', fontSize: '13px' }}>Frankfurt Warehouse (HUB-03)</strong>
                  <p style={{ fontSize: '12px', color: '#9aa8ba', margin: '4px 0 0 0' }}>Allocated for EMEA European regional deployments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Freight & Dispatch Ledger Table */}
          <div className="glass-panel" style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Active Warehouse Dispatch Ledger
                </h3>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
                  Real-time carrier tracking &amp; delivery status
                </span>
              </div>

              <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
                Showing {filteredFulfillments.length} Records
              </span>
            </div>

            {filteredFulfillments.length === 0 ? (
              <EmptyState
                title="No fulfillment orders found"
                description="There are currently no active orders assigned to the selected warehouse filter."
              />
            ) : (
              <div className="table-glass-wrapper">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Quote Code</th>
                      <th>Customer Account</th>
                      <th>Assigned Warehouse</th>
                      <th className="number-cell">Items Qty</th>
                      <th>Carrier / Freight</th>
                      <th>Tracking Number</th>
                      <th>Dispatch Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFulfillments.map((f) => (
                      <tr key={f.id}>
                        <td className="font-mono" style={{ fontWeight: 700, color: '#2f8cff' }}>
                          {f.quotationCode}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#f5f7fa' }}>{f.customerName}</div>
                          <div style={{ fontSize: '11px', color: '#9aa8ba' }}>{f.notes || 'Standard Freight'}</div>
                        </td>
                        <td>
                          <span className="badge-glass badge-glass-neutral">{f.warehouseHub}</span>
                        </td>
                        <td className="number-cell font-mono">{f.itemsCount} units</td>
                        <td>{f.carrier || 'Unassigned'}</td>
                        <td className="font-mono" style={{ fontSize: '12px', color: f.trackingNumber ? '#38d9ff' : '#64748b' }}>
                          {f.trackingNumber || 'Pending Pick'}
                        </td>
                        <td style={{ fontSize: '12px', color: '#9aa8ba' }}>{f.dispatchDate || 'Pending'}</td>
                        <td>
                          <Badge status={f.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-glass btn-glass-secondary btn-sm"
                            onClick={() => handleOpenDispatchModal(f)}
                          >
                            <Edit2 size={13} /> Update Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DISPATCH UPDATE MODAL */}
      {/* ========================================================================= */}
      {editingDispatchRecord && (
        <div
          className="search-modal-backdrop"
          onClick={() => setEditingDispatchRecord(null)}
        >
          <div
            className="search-modal-box"
            style={{ width: '520px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-modal-input-wrap">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                Update Fulfillment Dispatch ({editingDispatchRecord.quotationCode})
              </h3>
              <button onClick={() => setEditingDispatchRecord(null)} style={{ color: '#9aa8ba', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDispatch}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Order Fulfillment Stage *</label>
                  <select
                    className="input-glass-select"
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as FulfillmentStatus)}
                  >
                    <option value="pending_pick">Pending Warehouse Pick</option>
                    <option value="packing">Packing &amp; Palletizing</option>
                    <option value="dispatched">Dispatched / Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered &amp; Signed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Freight Carrier</label>
                  <input
                    type="text"
                    className="input-glass-select"
                    value={carrierInput}
                    onChange={(e) => setCarrierInput(e.target.value)}
                    placeholder="e.g. FedEx Freight Direct, UPS Enterprise"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Tracking Number</label>
                  <input
                    type="text"
                    className="input-glass-select font-mono"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="e.g. FX-88492019-US"
                  />
                </div>
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-glass btn-glass-secondary" onClick={() => setEditingDispatchRecord(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glass btn-glass-primary">
                  Save Dispatch Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REAL-TIME STOCK ADJUSTMENT MODAL */}
      {/* ========================================================================= */}
      {editingStockItem && (
        <div
          className="search-modal-backdrop"
          onClick={() => setEditingStockItem(null)}
        >
          <div
            className="search-modal-box"
            style={{ width: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-modal-input-wrap">
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700 }}>
                  Stock Adjustment Engine
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f5f7fa', margin: '2px 0 0 0' }}>
                  Adjust Stock — {editingStockItem.productName}
                </h3>
              </div>
              <button onClick={() => setEditingStockItem(null)} style={{ color: '#9aa8ba', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment}>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Meta details banner */}
                <div style={{ padding: '12px', background: 'rgba(7, 17, 31, 0.6)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9aa8ba' }}>SKU Code:</span>
                    <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#2f8cff' }}>{editingStockItem.sku}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9aa8ba' }}>Warehouse Location:</span>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f5f7fa' }}>{editingStockItem.warehouseName}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9aa8ba' }}>Category:</span>
                    <div style={{ fontSize: '12px', color: '#9aa8ba' }}>{editingStockItem.category}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: '#9aa8ba' }}>Unit of Measure:</span>
                    <div style={{ fontSize: '12px', color: '#9aa8ba', textTransform: 'lowercase' }}>{editingStockItem.unitOfMeasure || 'units'}</div>
                  </div>
                </div>

                {/* Total On-Hand Quantity Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#f5f7fa' }}>
                    Total On-Hand Quantity ({editingStockItem.unitOfMeasure || 'units'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-glass-select font-mono"
                    value={editTotalQuantity}
                    onChange={(e) => setEditTotalQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ fontSize: '15px', fontWeight: 700, color: '#2f8cff' }}
                  />
                  <span style={{ fontSize: '11px', color: '#9aa8ba' }}>
                    Physical physical units stored inside {editingStockItem.warehouseName}.
                  </span>
                </div>

                {/* Reserved Quantity Input */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#f5f7fa' }}>
                    Reserved Quantity for Active Orders ({editingStockItem.unitOfMeasure || 'units'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-glass-select font-mono"
                    value={editReservedQuantity}
                    onChange={(e) => setEditReservedQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{ fontSize: '15px', fontWeight: 700, color: '#f5b544' }}
                  />
                  <span style={{ fontSize: '11px', color: '#9aa8ba' }}>
                    Units soft-reserved for active quotations and pending picks.
                  </span>
                </div>

                {/* Live Calculated Available Stock Banner */}
                {(() => {
                  const avail = Math.max(0, editTotalQuantity - editReservedQuantity);
                  const isWarning = avail === 0;

                  return (
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        background: isWarning ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                        border: `1px solid ${isWarning ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: isWarning ? '#ef4444' : '#22c55e' }}>
                          Calculated Available Dispatch Stock
                        </div>
                        <div style={{ fontSize: '11px', color: '#9aa8ba' }}>
                          Formula: Total Quantity ({editTotalQuantity}) - Reserved Quantity ({editReservedQuantity})
                        </div>
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: isWarning ? '#ef4444' : '#22c55e',
                        }}
                      >
                        {avail.toLocaleString()} {editingStockItem.unitOfMeasure || 'units'}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-glass btn-glass-secondary" onClick={() => setEditingStockItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glass btn-glass-primary">
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
