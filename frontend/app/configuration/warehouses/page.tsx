'use client';

import * as React from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Package,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Input,
  Button,
  IconButton,
  Badge,
  Modal,
  useToast,
  ProgressBar,
} from '@/components/ui';
import { warehousesService } from '@/services';
import type { WarehouseConfig } from '@/types';

export default function WarehousesConfigPage() {
  const toast = useToast();
  const [warehouses, setWarehouses] = React.useState<WarehouseConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    warehousesService.getWarehouses().then((data) => {
      if (isMounted) {
        setWarehouses(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingWarehouse, setEditingWarehouse] = React.useState<WarehouseConfig | null>(null);

  // Form State
  const [formData, setFormData] = React.useState({
    name: '',
    code: '',
    location: '',
    capacityUnits: 15000,
    status: 'active' as 'active' | 'maintenance' | 'full_capacity',
  });

  const filteredWarehouses = React.useMemo(() => {
    return warehouses.filter(
      (w) =>
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [warehouses, searchQuery]);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '',
      code: `WH-REG-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      location: '',
      capacityUnits: 15000,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (wh: WarehouseConfig) => {
    setEditingWarehouse(wh);
    setFormData({
      name: wh.name,
      code: wh.code,
      location: wh.location,
      capacityUnits: wh.capacityUnits,
      status: wh.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveWarehouse = () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      toast.error('Validation Error', 'Warehouse name and location are required.');
      return;
    }

    if (editingWarehouse) {
      setWarehouses((prev) =>
        prev.map((w) =>
          w.id === editingWarehouse.id
            ? {
                ...w,
                name: formData.name,
                code: formData.code,
                location: formData.location,
                capacityUnits: Number(formData.capacityUnits),
                status: formData.status,
              }
            : w
        )
      );
      toast.success('Warehouse Updated', `${formData.name} updated.`);
    } else {
      const newWh: WarehouseConfig = {
        id: `wh_${Date.now()}`,
        name: formData.name,
        code: formData.code,
        location: formData.location,
        status: formData.status,
        capacityUnits: Number(formData.capacityUnits),
        currentStockUnits: 0,
        inventoryBreakdown: [],
      };
      setWarehouses((prev) => [...prev, newWh]);
      toast.success('Warehouse Added', `${formData.name} added to logistics network.`);
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: WarehouseConfig['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active Operational</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Scheduled Maintenance</Badge>;
      case 'full_capacity':
        return <Badge variant="danger">Full Capacity</Badge>;
    }
  };

  return (
    <AppShell title="Warehouses Configuration" subtitle="Multi-Location Facilities & Inventory Stock Depots">
      <PageHeader
        title="Warehouse Facilities & Inventory Summary"
        subtitle="Manage logistics hubs, regional distribution centers, and real-time inventory allocation reserves"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Warehouse Facility</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* SEARCH BAR */}
        <GlassCard className="p-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search warehouse name, location, code..."
            />
          </div>
        </GlassCard>

        {/* WAREHOUSE CARDS & INVENTORY SUMMARY */}
        <div className="grid grid-cols-1 gap-6">
          {filteredWarehouses.map((wh) => {
            const utilization = ((wh.currentStockUnits / wh.capacityUnits) * 100).toFixed(1);
            return (
              <GlassCard key={wh.id} className="p-5 space-y-4 border-l-4 border-l-cyan-500">
                {/* WAREHOUSE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-cyan-400" />
                      <h3 className="text-sm font-extrabold text-slate-100">{wh.name}</h3>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        {wh.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3 w-3 text-slate-500" />
                      <span>{wh.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {getStatusBadge(wh.status)}
                    <IconButton
                      variant="ghost"
                      size="xs"
                      onClick={() => handleOpenEdit(wh)}
                      icon={<Edit2 className="h-3.5 w-3.5 text-cyan-400" />}
                    />
                  </div>
                </div>

                {/* CAPACITY UTILIZATION BAR */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center text-xs">
                  <div className="md:col-span-3 space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Storage Capacity Utilization:</span>
                      <span className="font-mono font-bold text-slate-100">
                        {wh.currentStockUnits.toLocaleString()} / {wh.capacityUnits.toLocaleString()} Units ({utilization}%)
                      </span>
                    </div>
                    <ProgressBar value={Number(utilization)} max={100} size="sm" variant="cyan" />
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-right">
                    <span className="text-[10px] text-slate-400 uppercase block">Active SKU Lines</span>
                    <span className="text-sm font-extrabold text-slate-100 font-mono">
                      {wh.inventoryBreakdown.length} Products
                    </span>
                  </div>
                </div>

                {/* INVENTORY SUMMARY BREAKDOWN TABLE */}
                {wh.inventoryBreakdown.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-slate-400" />
                      Inventory Breakdown Summary
                    </h4>

                    <div className="overflow-x-auto border border-white/10 rounded-xl bg-white/[0.02] p-2">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3">Product Name</th>
                            <th className="py-2 px-3 text-right">Available Stock</th>
                            <th className="py-2 px-3 text-right">Reserved Stock</th>
                            <th className="py-2 px-3 text-right">Reorder Threshold</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {wh.inventoryBreakdown.map((item) => (
                            <tr key={item.sku} className="hover:bg-white/[0.02]">
                              <td className="py-2 px-3 font-mono text-cyan-400 text-[11px]">{item.sku}</td>
                              <td className="py-2 px-3 font-medium text-slate-200">{item.productName}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                                {item.available} units
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-amber-400 font-semibold">
                                {item.reserved} units
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-slate-400">
                                {item.reorderPoint} units
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse — ${editingWarehouse.code}` : 'Add Warehouse Facility'}
        description="Configure logistics facility location, capacity, and operational status."
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveWarehouse}>
              {editingWarehouse ? 'Save Changes' : 'Create Facility'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          <Input
            label="Warehouse Facility Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Warehouse East (Boston Hub)"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Facility Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="WH-EAST-BOS"
            />

            <Input
              label="Location (City, State)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Boston, MA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              label="Total Capacity Units"
              value={formData.capacityUnits}
              onChange={(e) => setFormData({ ...formData, capacityUnits: parseInt(e.target.value) || 0 })}
            />

            <Select
              label="Operational Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={[
                { value: 'active', label: 'Active Operational' },
                { value: 'maintenance', label: 'Scheduled Maintenance' },
                { value: 'full_capacity', label: 'Full Capacity' },
              ]}
            />
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
