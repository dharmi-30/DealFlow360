import React, { useState } from 'react';
import { FulfillmentRecord, FulfillmentStatus } from '../../types';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import {
  Truck,
  Warehouse,
  CheckCircle2,
  Edit2,
  X,
  Split,
  Box,
  Info,
} from 'lucide-react';

interface FulfillmentViewProps {
  fulfillments: FulfillmentRecord[];
  onUpdateFulfillment: (recordId: string, status: FulfillmentStatus, carrier?: string, tracking?: string) => void;
}

export const FulfillmentView: React.FC<FulfillmentViewProps> = ({
  fulfillments,
  onUpdateFulfillment,
}) => {
  const [selectedHub, setSelectedHub] = useState<string>('all');
  const [editingRecord, setEditingRecord] = useState<FulfillmentRecord | null>(null);
  const [carrierInput, setCarrierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusInput, setStatusInput] = useState<FulfillmentStatus>('dispatched');

  const pendingPicks = fulfillments.filter((f) => f.status === 'pending_pick');

  const filteredFulfillments = fulfillments.filter((f) => {
    if (selectedHub === 'all') return true;
    return f.warehouseHub.toLowerCase().includes(selectedHub.toLowerCase());
  });

  const handleOpenDispatchModal = (record: FulfillmentRecord) => {
    setEditingRecord(record);
    setCarrierInput(record.carrier || 'FedEx Freight Direct');
    setTrackingInput(record.trackingNumber || `FX-${Math.floor(10000000 + Math.random() * 90000000)}-US`);
    setStatusInput(record.status);
  };

  const handleSaveDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    onUpdateFulfillment(editingRecord.id, statusInput, carrierInput, trackingInput);
    setEditingRecord(null);
  };

  return (
    <div style={{ paddingBottom: '32px' }}>
      {/* Page Header */}
      <div className="page-header-row" style={{ marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, letterSpacing: '0.05em' }}>
              Logistics & Fulfillment
            </span>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
            <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Multi-Hub Inventory Split Engine (schema.sql)</span>
          </div>
          <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
            Fulfillment Operations
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            className="input-glass-select"
            value={selectedHub}
            onChange={(e) => setSelectedHub(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="all">All Warehouses</option>
            <option value="Dallas">Dallas (HUB-01)</option>
            <option value="Chicago">Chicago (HUB-02)</option>
            <option value="Frankfurt">Frankfurt (HUB-03)</option>
          </select>
        </div>
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
              <p style={{ fontSize: '12px', color: '#9aa8ba', margin: '4px 0 0 0' }}>Allocated for US South & West regional dispatches.</p>
            </div>
            <div style={{ padding: '12px', background: 'rgba(7, 17, 31, 0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <strong style={{ color: '#f5f7fa', fontSize: '13px' }}>Chicago Warehouse (HUB-02)</strong>
              <p style={{ fontSize: '12px', color: '#9aa8ba', margin: '4px 0 0 0' }}>Allocated for US Midwest & East Coast shipments.</p>
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
              Real-time carrier tracking & delivery status
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

      {/* Dispatch Update Modal */}
      {editingRecord && (
        <div className="search-modal-backdrop">
          <div className="search-modal-box" style={{ width: '520px' }}>
            <div className="search-modal-input-wrap">
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                Update Fulfillment Dispatch ({editingRecord.quotationCode})
              </h3>
              <button onClick={() => setEditingRecord(null)} style={{ color: '#9aa8ba' }}>
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
                    <option value="packing">Packing & Palletizing</option>
                    <option value="dispatched">Dispatched / Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered & Signed</option>
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
                <button type="button" className="btn-glass btn-glass-secondary" onClick={() => setEditingRecord(null)}>
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
    </div>
  );
};
