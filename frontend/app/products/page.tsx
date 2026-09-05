'use client';

import * as React from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Tag,
  DollarSign,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  PageHeader,
  GlassCard,
  SearchInput,
  Select,
  Input,
  Textarea,
  Button,
  IconButton,
  Badge,
  Modal,
  useToast,
} from '@/components/ui';
import { productsService } from '@/services';
import type { ProductItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ProductsPage() {
  const toast = useToast();
  const [products, setProducts] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    productsService.getProducts().then((data) => {
      if (isMounted) {
        setProducts(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

  // Form Modal State (Add / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<ProductItem | null>(null);

  // View Inspector Modal State
  const [viewingProduct, setViewingProduct] = React.useState<ProductItem | null>(null);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    sku: '',
    category: 'Hardware' as 'Hardware' | 'Services' | 'Subscriptions',
    unitPrice: 0,
    costPrice: 0,
    taxRate: 10,
    stockAvailability: 100,
    isSubscription: false,
    recurringPeriod: 'annual' as 'monthly' | 'annual',
  });

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // Open Form Modal for Create
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      category: 'Hardware',
      unitPrice: 1000,
      costPrice: 600,
      taxRate: 10,
      stockAvailability: 100,
      isSubscription: false,
      recurringPeriod: 'annual',
    });
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit
  const handleOpenEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      taxRate: 10,
      stockAvailability: product.stockAvailability,
      isSubscription: product.isSubscription,
      recurringPeriod: product.recurringPeriod || 'annual',
    });
    setIsFormModalOpen(true);
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async () => {
    if (!formData.name.trim() || !formData.sku.trim()) {
      toast.error('Validation Error', 'Product name and SKU are required.');
      return;
    }

    if (editingProduct) {
      const updated = await productsService.updateProduct(editingProduct.id, {
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unitPrice: Number(formData.unitPrice),
        costPrice: Number(formData.costPrice),
        stockAvailability: Number(formData.stockAvailability),
        isSubscription: formData.isSubscription,
        recurringPeriod: formData.isSubscription ? formData.recurringPeriod : undefined,
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success('Product Updated', `${formData.name} updated successfully.`);
    } else {
      const newProd = await productsService.createProduct({
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        unitPrice: Number(formData.unitPrice),
        costPrice: Number(formData.costPrice),
        stockAvailability: Number(formData.stockAvailability),
        isSubscription: formData.isSubscription,
        recurringPeriod: formData.isSubscription ? formData.recurringPeriod : undefined,
      });
      setProducts((prev) => [newProd, ...prev]);
      toast.success('Product Created', `${formData.name} added to catalog.`);
    }

    setIsFormModalOpen(false);
  };

  return (
    <AppShell title="Product Catalog" subtitle="Master Products, Pricing & SKU Management">
      <PageHeader
        title="Product Catalog Configuration"
        subtitle="Manage master products, base pricing, costs, tax rates & subscription features"
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenCreateModal} className="gap-1 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add Product</span>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* SEARCH & CATEGORY FILTERS */}
        <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search product name, SKU..."
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {['all', 'Hardware', 'Services', 'Subscriptions'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* PRODUCTS DIRECTORY TABLE */}
        <GlassCard className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Product Master Catalog ({filteredProducts.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Cost</th>
                  <th className="py-2.5 px-3 text-center">Tax</th>
                  <th className="py-2.5 px-3 text-center">Subscription Capable</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredProducts.map((p) => {
                  const marginPct = (((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(1);
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-slate-100">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-cyan-400 text-[11px]">{p.sku}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-[10px] py-0">
                          {p.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-100 font-mono">
                        {formatCurrency(p.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {formatCurrency(p.costPrice)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">10% EST</td>
                      <td className="py-3 px-3 text-center font-mono">
                        {p.isSubscription ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/15 text-violet-400">
                            <RefreshCw className="h-2.5 w-2.5" />
                            Yes ({p.recurringPeriod})
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No (One-time)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            variant="ghost"
                            size="xs"
                            onClick={() => setViewingProduct(p)}
                            icon={<Eye className="h-3.5 w-3.5 text-slate-400" />}
                          />
                          <IconButton
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditModal(p)}
                            icon={<Edit2 className="h-3.5 w-3.5 text-cyan-400" />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* CREATE / EDIT PRODUCT FORM MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProduct ? `Edit Product — ${editingProduct.sku}` : 'Add New Master Product'}
        description="Configure product metadata, base price, cost, tax, and subscription options."
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveProduct}>
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Avionics Processing Node"
            />
            <Input
              label="SKU Code"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="SKU-XXX-01"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as any })
              }
              options={[
                { value: 'Hardware', label: 'Hardware' },
                { value: 'Services', label: 'Services' },
                { value: 'Subscriptions', label: 'Subscriptions' },
              ]}
            />

            <Input
              type="number"
              label="Unit Selling Price ($)"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
            />

            <Input
              type="number"
              label="Cost Price ($)"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 items-center">
            <Input
              type="number"
              label="Est Tax Rate (%)"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
            />

            <Input
              type="number"
              label="Stock Available"
              value={formData.stockAvailability}
              onChange={(e) => setFormData({ ...formData, stockAvailability: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* SUBSCRIPTION CAPABLE TOGGLE */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-100 block">Subscription Capable</span>
              <span className="text-[11px] text-slate-400">
                Enable recurring billing for subscription or SLA maintenance contracts.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.isSubscription}
              onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
              className="h-4 w-4 rounded text-cyan-500 focus:ring-cyan-500"
            />
          </div>

          {formData.isSubscription && (
            <Select
              label="Recurring Period"
              value={formData.recurringPeriod}
              onChange={(e) => setFormData({ ...formData, recurringPeriod: e.target.value as any })}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'annual', label: 'Annual / Yearly' },
              ]}
            />
          )}
        </div>
      </Modal>

      {/* VIEW PRODUCT INSPECTOR MODAL */}
      <Modal
        isOpen={!!viewingProduct}
        onClose={() => setViewingProduct(null)}
        title={`Product Details — ${viewingProduct?.name}`}
        description="Master catalog specification and base pricing breakdown"
        size="md"
        footer={
          <Button variant="primary" size="sm" onClick={() => setViewingProduct(null)}>
            Close Inspector
          </Button>
        }
      >
        {viewingProduct && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Product SKU</span>
                <span className="font-mono font-bold text-cyan-400">{viewingProduct.sku}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-slate-400 font-semibold block">Category</span>
                <span className="font-bold text-slate-200">{viewingProduct.category}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Unit Selling Price</span>
                <span className="font-extrabold text-cyan-400 font-mono text-sm">
                  {formatCurrency(viewingProduct.unitPrice)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Cost Price</span>
                <span className="font-bold text-slate-300 font-mono text-xs">
                  {formatCurrency(viewingProduct.costPrice)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Base Margin %</span>
                <span className="font-bold text-emerald-400 font-mono text-xs">
                  {(((viewingProduct.unitPrice - viewingProduct.costPrice) / viewingProduct.unitPrice) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
