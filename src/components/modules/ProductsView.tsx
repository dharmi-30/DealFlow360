import React, { useState } from 'react';
import { Product } from '../../types';
import {
  Package,
  Layers,
  Tag,
  Percent,
  Sliders,
  CheckCircle2,
  Settings2,
  ChevronRight,
  Shield,
  Save,
  Sparkles,
  Info,
  Plus,
  X,
  Archive,
  Trash2,
  Edit,
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onAddProduct?: (product: Product) => void;
  onArchiveProducts?: (productIds: string[]) => void;
  onDeleteProducts?: (productIds: string[]) => void;
  onUpdateProduct?: (product: Product) => void;
}

interface DetailedProductItem {
  id: string;
  name: string;
  category: string;
  variantsCount: number;
  price: number;
  unit: string;
  taxPct: number;
  status: 'Active' | 'Inactive' | 'Draft' | 'Discontinued' | 'Archived';
  description: string;
  isSubscription: boolean;
  recurringCycle: string;
  quantityOnHand: number;
  variants: { name: string; sku: string; price: number; stock: number }[];
  priceLists: { name: string; discountPct: number; netPrice: number }[];
}

const EXTENDED_PRODUCTS: DetailedProductItem[] = [
  {
    id: 'prod-1',
    name: 'Laptop Pro 14',
    category: 'Hardware',
    variantsCount: 3,
    price: 1200.0,
    unit: 'Unit',
    taxPct: 8.5,
    status: 'Active',
    description: 'High-performance workstation laptop with Apple M3 / Intel i7 configuration.',
    isSubscription: false,
    recurringCycle: 'N/A',
    quantityOnHand: 40,
    variants: [
      { name: '14-inch Base (16GB RAM / 512GB SSD)', sku: 'LAP-14-BASE', price: 1200.0, stock: 24 },
      { name: '14-inch Pro (32GB RAM / 1TB SSD)', sku: 'LAP-14-PRO', price: 1550.0, stock: 12 },
      { name: '14-inch Max (64GB RAM / 2TB SSD)', sku: 'LAP-14-MAX', price: 1950.0, stock: 4 },
    ],
    priceLists: [
      { name: 'Standard Commercial List', discountPct: 0, netPrice: 1200.0 },
      { name: 'Enterprise Volume Tier', discountPct: 10, netPrice: 1080.0 },
      { name: 'Federal GSA Schedule', discountPct: 15, netPrice: 1020.0 },
    ],
  },
  {
    id: 'prod-2',
    name: 'Onsite Setup Service',
    category: 'Services',
    variantsCount: 2,
    price: 450.0,
    unit: 'Session',
    taxPct: 0.0,
    status: 'Active',
    description: 'Onsite technical hardware deployment, network integration, and user onboarding.',
    isSubscription: false,
    recurringCycle: 'N/A',
    quantityOnHand: 999,
    variants: [
      { name: 'Standard Onsite Setup (Half Day)', sku: 'SVC-SETUP-HALF', price: 450.0, stock: 999 },
      { name: 'Enterprise Full Day Onsite Setup', sku: 'SVC-SETUP-FULL', price: 850.0, stock: 999 },
    ],
    priceLists: [
      { name: 'Standard Commercial List', discountPct: 0, netPrice: 450.0 },
      { name: 'Enterprise Volume Tier', discountPct: 8, netPrice: 414.0 },
      { name: 'Federal GSA Schedule', discountPct: 10, netPrice: 405.0 },
    ],
  },
  {
    id: 'prod-3',
    name: 'Care Plan 2yr',
    category: 'Software Subscription',
    variantsCount: 2,
    price: 3650.0,
    unit: 'Contract',
    taxPct: 5.0,
    status: 'Active',
    description: '2-year comprehensive SaaS support, automated system updates, and 24/7 SLA.',
    isSubscription: true,
    recurringCycle: 'Monthly',
    quantityOnHand: 999,
    variants: [
      { name: 'Care Plan 2yr (Standard SLA)', sku: 'SUB-CARE-2Y-STD', price: 3650.0, stock: 999 },
      { name: 'Care Plan 2yr (Premium 1-Hr SLA)', sku: 'SUB-CARE-2Y-PREM', price: 450.0, stock: 999 },
    ],
    priceLists: [
      { name: 'Standard Commercial List', discountPct: 0, netPrice: 3650.0 },
      { name: 'Enterprise Volume Tier', discountPct: 12, netPrice: 3212.0 },
      { name: 'Federal GSA Schedule', discountPct: 15, netPrice: 3102.5 },
    ],
  },
  {
    id: 'prod-4',
    name: 'Support SLA',
    category: 'Support',
    variantsCount: 2,
    price: 850.0,
    unit: 'Account',
    taxPct: 0.0,
    status: 'Active',
    description: 'Dedicated technical account manager and priority escalation queue.',
    isSubscription: true,
    recurringCycle: 'Monthly',
    quantityOnHand: 999,
    variants: [
      { name: 'Support SLA (Business)', sku: 'SUP-SLA-BIZ', price: 850.0, stock: 999 },
      { name: 'Support SLA (Enterprise 24/7)', sku: 'SUP-SLA-ENT', price: 1450.0, stock: 999 },
    ],
    priceLists: [
      { name: 'Standard Commercial List', discountPct: 0, netPrice: 850.0 },
      { name: 'Enterprise Volume Tier', discountPct: 10, netPrice: 765.0 },
    ],
  },
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products = [],
  onAddProduct,
  onArchiveProducts,
  onDeleteProducts,
  onUpdateProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'discount-config'>('catalog');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProductItem, setEditingProductItem] = useState<DetailedProductItem | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'Active' | 'Inactive' | 'Archived'>>({});

  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    category: 'Hardware',
    listPrice: '',
    cogs: '',
    minMarginPct: '20.0',
    defaultDiscountPct: '5.0',
    inStock: '100',
    description: '',
  });

  const [editProductForm, setEditProductForm] = useState({
    id: '',
    name: '',
    sku: '',
    category: 'Hardware',
    listPrice: '',
    cogs: '',
    minMarginPct: '20.0',
    defaultDiscountPct: '5.0',
    inStock: '100',
    description: '',
    status: 'Active',
  });

  const handleOpenEditModal = (item: DetailedProductItem) => {
    const rawProd = products.find((p) => p.id === item.id);
    setEditingProductItem(item);
    setEditProductForm({
      id: item.id,
      name: item.name,
      sku: (item as any).sku || rawProd?.sku || `SKU-${item.id.toUpperCase()}`,
      category: item.category,
      listPrice: item.price.toString(),
      cogs: ((item as any).cogs ?? rawProd?.cogs ?? Math.round(item.price * 0.65)).toString(),
      minMarginPct: ((item as any).minMarginPct ?? rawProd?.minMarginPct ?? 20.0).toString(),
      defaultDiscountPct: ((item as any).defaultDiscountPct ?? rawProd?.defaultDiscountPct ?? 5.0).toString(),
      inStock: (item.quantityOnHand ?? rawProd?.inStock ?? 100).toString(),
      description: item.description || rawProd?.description || '',
      status: item.status || rawProd?.status || 'Active',
    });
    setIsEditModalOpen(true);
  };

  const handleEditProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductForm.id || !editProductForm.name || !editProductForm.sku || !editProductForm.listPrice) return;

    const listPriceNum = parseFloat(editProductForm.listPrice) || 0;
    const cogsNum = parseFloat(editProductForm.cogs || '0') || 0;
    const minMarginNum = parseFloat(editProductForm.minMarginPct || '20.0') || 0;
    const defaultDiscountNum = parseFloat(editProductForm.defaultDiscountPct || '5.0') || 0;
    const inStockNum = parseInt(editProductForm.inStock || '100', 10) || 0;
    const categoryVal = editProductForm.category as any;
    const statusVal = editProductForm.status as 'Active' | 'Inactive' | 'Archived';

    const updatedProduct: Product = {
      id: editProductForm.id,
      sku: editProductForm.sku.toUpperCase().trim(),
      name: editProductForm.name.trim(),
      category: categoryVal,
      description: editProductForm.description.trim() || `${editProductForm.name} - Commercial Catalog Product`,
      listPrice: listPriceNum,
      cogs: cogsNum,
      minMarginPct: minMarginNum,
      defaultDiscountPct: defaultDiscountNum,
      upsellIds: [],
      crossSellIds: [],
      inStock: inStockNum,
      status: statusVal,
    };

    setStatusOverrides((prev) => ({
      ...prev,
      [updatedProduct.id]: statusVal,
    }));

    if (onUpdateProduct) {
      onUpdateProduct(updatedProduct);
    }

    setIsEditModalOpen(false);
    setSaveNotice(`Product "${updatedProduct.name}" (${updatedProduct.sku}) updated successfully.`);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  // Convert schema.sql parsed products into detailed view items
  const dynamicProductList: DetailedProductItem[] = products.map((p) => {
    const statusVal = statusOverrides[p.id] || p.status || 'Active';
    return {
      id: p.id,
      name: p.name,
      category: p.category || 'Hardware',
      variantsCount: 3,
      price: p.listPrice,
      unit: p.category.includes('Subscription') || p.category.includes('Support') ? 'Contract' : p.category.includes('Services') ? 'Session' : 'Unit',
      taxPct: p.category.includes('Services') ? 0.0 : 8.5,
      status: statusVal as any,
      description: p.description || `${p.name} - Enterprise Commercial Grade Product`,
      isSubscription: p.category.includes('Subscription') || p.category.includes('Support'),
      recurringCycle: p.category.includes('Subscription') || p.category.includes('Support') ? 'Monthly' : 'N/A',
      quantityOnHand: p.inStock || 100,
      variants: [
        { name: `${p.name} (Base Configuration)`, sku: p.sku, price: p.listPrice, stock: Math.round((p.inStock || 100) * 0.6) },
        { name: `${p.name} (Enterprise Spec)`, sku: `${p.sku}-ENT`, price: Math.round(p.listPrice * 1.25), stock: Math.round((p.inStock || 100) * 0.4) },
      ],
      priceLists: [
        { name: 'Standard Commercial List', discountPct: 0, netPrice: p.listPrice },
        { name: 'Enterprise Volume Tier', discountPct: 10, netPrice: Number((p.listPrice * 0.9).toFixed(2)) },
        { name: 'Federal GSA Schedule', discountPct: 15, netPrice: Number((p.listPrice * 0.85).toFixed(2)) },
      ],
    };
  });

  const productList = dynamicProductList.length > 0 ? dynamicProductList : EXTENDED_PRODUCTS;
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Discount Configuration Editable State
  const [tierLimits, setTierLimits] = useState({
    bronze: 5,
    silver: 10,
    gold: 15,
  });

  const [categoryLimits, setCategoryLimits] = useState({
    hardware: 15,
    services: 10,
  });

  const [approvalMapping, setApprovalMapping] = useState({
    withinLimit: 'No approval',
    mediumRisk: 'Sales Manager',
    highRisk: 'Sales Manager + Finance',
  });

  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleSaveDiscountConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice('Discount limits and approval mapping rules updated successfully.');
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleCreateProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.sku || !newProductForm.listPrice) return;

    const listPriceNum = parseFloat(newProductForm.listPrice);
    const cogsNum = parseFloat(newProductForm.cogs || '0');
    const inStockNum = parseInt(newProductForm.inStock || '100', 10);
    const categoryVal = newProductForm.category as any;

    const createdProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: newProductForm.sku.toUpperCase().trim(),
      name: newProductForm.name.trim(),
      category: categoryVal,
      description: newProductForm.description.trim() || `${newProductForm.name} - Commercial Catalog Product`,
      listPrice: listPriceNum,
      cogs: cogsNum,
      minMarginPct: parseFloat(newProductForm.minMarginPct || '20.0'),
      defaultDiscountPct: parseFloat(newProductForm.defaultDiscountPct || '5.0'),
      upsellIds: [],
      crossSellIds: [],
      inStock: inStockNum,
    };

    if (onAddProduct) {
      onAddProduct(createdProduct);
    }

    const detailedItem: DetailedProductItem = {
      id: createdProduct.id,
      name: createdProduct.name,
      category: createdProduct.category,
      variantsCount: 2,
      price: createdProduct.listPrice,
      unit: categoryVal.includes('Subscription') || categoryVal.includes('Support') ? 'Contract' : categoryVal.includes('Services') ? 'Session' : 'Unit',
      taxPct: categoryVal.includes('Services') ? 0.0 : 8.5,
      status: 'Active',
      description: createdProduct.description,
      isSubscription: categoryVal.includes('Subscription') || categoryVal.includes('Support'),
      recurringCycle: categoryVal.includes('Subscription') || categoryVal.includes('Support') ? 'Monthly' : 'N/A',
      quantityOnHand: createdProduct.inStock,
      variants: [
        { name: `${createdProduct.name} (Base Spec)`, sku: createdProduct.sku, price: createdProduct.listPrice, stock: Math.round(createdProduct.inStock * 0.6) },
        { name: `${createdProduct.name} (Enterprise Spec)`, sku: `${createdProduct.sku}-ENT`, price: Math.round(createdProduct.listPrice * 1.25), stock: Math.round(createdProduct.inStock * 0.4) },
      ],
      priceLists: [
        { name: 'Standard Commercial List', discountPct: 0, netPrice: createdProduct.listPrice },
        { name: 'Enterprise Volume Tier', discountPct: 10, netPrice: Number((createdProduct.listPrice * 0.9).toFixed(2)) },
        { name: 'Federal GSA Schedule', discountPct: 15, netPrice: Number((createdProduct.listPrice * 0.85).toFixed(2)) },
      ],
    };

    setSelectedProduct(detailedItem);
    setIsDetailModalOpen(true);
    setIsCreateModalOpen(false);
    setSaveNotice(`Product "${createdProduct.name}" (${createdProduct.sku}) created and added to commercial catalog.`);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const isAllSelected = productList.length > 0 && productList.every((p) => selectedProductIds.includes(p.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(productList.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleArchiveSelected = () => {
    if (selectedProductIds.length === 0) return;
    const newOverrides = { ...statusOverrides };
    selectedProductIds.forEach((id) => {
      newOverrides[id] = 'Inactive';
    });
    setStatusOverrides(newOverrides);

    if (onArchiveProducts) {
      onArchiveProducts(selectedProductIds);
    }
    setSaveNotice(`Archived ${selectedProductIds.length} product(s). Status updated to Inactive in database.`);
    setSelectedProductIds([]);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  const handleDeleteSelected = () => {
    if (selectedProductIds.length === 0) return;
    if (onDeleteProducts) {
      onDeleteProducts(selectedProductIds);
    }
    setSaveNotice(`Permanently deleted ${selectedProductIds.length} product(s) from database.`);
    setSelectedProductIds([]);
    setTimeout(() => setSaveNotice(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Product Catalog & Commercial Controls</h1>
          <p className="page-subheading">
            Commercial price lists, variant management, and discount governance ceilings.
          </p>
        </div>

        {/* Tab Switcher & Add Product Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-glass btn-glass-primary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(47, 140, 255, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>

          <div style={{ display: 'flex', gap: '4px', background: 'rgba(7,17,31,0.6)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setActiveTab('catalog')}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'catalog' ? '#2f8cff' : 'transparent',
                color: activeTab === 'catalog' ? '#fff' : '#9aa8ba',
              }}
            >
              Product Dashboard
            </button>
            <button
              onClick={() => setActiveTab('discount-config')}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'discount-config' ? '#2f8cff' : 'transparent',
                color: activeTab === 'discount-config' ? '#fff' : '#9aa8ba',
              }}
            >
              Discount Configuration
            </button>
          </div>
        </div>
      </div>

      {saveNotice && (
        <div
          style={{
            background: 'rgba(49,211,138,0.12)',
            border: '1px solid rgba(49,211,138,0.3)',
            borderRadius: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            color: '#31d38a',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Sparkles size={16} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* TAB 1: PRODUCT DASHBOARD & DETAIL */}
      {activeTab === 'catalog' && (
        <>
          {/* TOP SUMMARY CARDS (Total Products, Price Lists, Variants) */}
          <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div className="kpi-glass-card">
              <div className="kpi-head">
                <span className="kpi-label">Total Products</span>
                <Package size={16} style={{ color: '#38d9ff' }} />
              </div>
              <div className="kpi-main-val" style={{ color: '#38d9ff' }}>
                18 Products
              </div>
              <div className="kpi-sub-label">Commercial catalog SKUs</div>
            </div>

            <div className="kpi-glass-card">
              <div className="kpi-head">
                <span className="kpi-label">Price Lists</span>
                <Tag size={16} style={{ color: '#31d38a' }} />
              </div>
              <div className="kpi-main-val" style={{ color: '#31d38a' }}>
                3 Price Lists
              </div>
              <div className="kpi-sub-label">Standard, Enterprise, GSA Schedule</div>
            </div>

            <div className="kpi-glass-card">
              <div className="kpi-head">
                <span className="kpi-label">Variants</span>
                <Layers size={16} style={{ color: '#f5b544' }} />
              </div>
              <div className="kpi-main-val" style={{ color: '#f5b544' }}>
                42 Variants
              </div>
              <div className="kpi-sub-label">Active product configurations</div>
            </div>
          </div>

          {/* PRODUCT DASHBOARD TABLE */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', margin: 0 }}>
                  Product Dashboard Table ({productList.length} SKUs)
                </h3>
                <span style={{ fontSize: '12px', color: '#9aa8ba' }}>
                  Select checkboxes for bulk operations or click row to view details
                </span>
              </div>
              <button
                className="btn-glass btn-glass-primary btn-sm"
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)',
                }}
              >
                <Plus size={14} />
                <span>Create Product</span>
              </button>
            </div>

            {/* BULK ACTION BAR */}
            {selectedProductIds.length > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(13, 25, 48, 0.95) 0%, rgba(20, 35, 60, 0.95) 100%)',
                  border: '1px solid rgba(47, 140, 255, 0.4)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge-glass badge-glass-info" style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px' }}>
                    {selectedProductIds.length} selected
                  </span>
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                    Select an action for highlighted product SKUs:
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Archive Button */}
                  <button
                    type="button"
                    onClick={handleArchiveSelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(245, 181, 68, 0.16)',
                      color: '#f5b544',
                      border: '1px solid rgba(245, 181, 68, 0.4)',
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Archive size={14} />
                    <span>Archive (Set Inactive)</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(255, 107, 114, 0.18)',
                      color: '#ff6b72',
                      border: '1px solid rgba(255, 107, 114, 0.45)',
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Permanently</span>
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds([])}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#9aa8ba',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 8px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="table-glass-wrapper">
              <table className="table-glass">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer', accentColor: '#2f8cff', width: '15px', height: '15px' }}
                      />
                    </th>
                    <th>Product</th>
                    <th>Category</th>
                    <th className="number-cell">Variants</th>
                    <th className="number-cell">Price</th>
                    <th>Unit</th>
                    <th className="number-cell">Tax</th>
                    <th>Status</th>
                    <th className="number-cell">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {productList.map((item) => {
                    const isSelected = Boolean(selectedProduct && item.id === selectedProduct.id);
                    const isChecked = selectedProductIds.includes(item.id);
                    const isInactive = item.status === 'Inactive' || item.status === 'Discontinued' || item.status === 'Draft';

                    return (
                      <tr
                        key={item.id}
                        className={`clickable ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => {
                          setSelectedProduct(item);
                          setIsDetailModalOpen(true);
                        }}
                        style={{
                          background: isChecked ? 'rgba(47, 140, 255, 0.18)' : isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                        }}
                      >
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelectProduct(item.id)}
                            style={{ cursor: 'pointer', accentColor: '#2f8cff', width: '15px', height: '15px' }}
                          />
                        </td>
                        <td style={{ fontWeight: 700, color: '#f5f7fa' }}>{item.name}</td>
                        <td>
                          <span className="badge-glass badge-glass-neutral">{item.category}</span>
                        </td>
                        <td className="number-cell font-mono">{item.variantsCount} variants</td>
                        <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#38d9ff' }}>
                          ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontSize: '12px', color: '#9aa8ba' }}>{item.unit}</td>
                        <td className="number-cell font-mono">{item.taxPct.toFixed(1)}%</td>
                        <td>
                          {isInactive ? (
                            <span className="badge-glass" style={{ background: 'rgba(245, 181, 68, 0.15)', color: '#f5b544', border: '1px solid rgba(245,181,68,0.3)' }}>
                              Inactive
                            </span>
                          ) : (
                            <span className="badge-glass badge-glass-success">Active</span>
                          )}
                        </td>
                        <td className="number-cell">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn-glass btn-glass-primary btn-sm"
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                background: 'rgba(47, 140, 255, 0.2)',
                                border: '1px solid rgba(47, 140, 255, 0.4)',
                                color: '#38d9ff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                            >
                              <Edit size={12} /> Edit
                            </button>
                            <button
                              type="button"
                              className="btn-glass btn-glass-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(item);
                                setIsDetailModalOpen(true);
                              }}
                            >
                              Inspect <ChevronRight size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRODUCT DETAIL POPUP BOX / MODAL */}
          {isDetailModalOpen && selectedProduct && (
            <div
              className="modal-backdrop"
              onClick={() => setIsDetailModalOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(5, 12, 24, 0.84)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
              }}
            >
              <div
                className="glass-panel"
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: '920px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  borderRadius: '16px',
                  border: '1px solid rgba(47, 140, 255, 0.3)',
                  background: 'linear-gradient(145deg, rgba(13, 25, 48, 0.96) 0%, rgba(7, 16, 33, 0.98) 100%)',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
                  padding: '28px',
                }}
              >
                {/* Modal Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(47, 140, 255, 0.16)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2f8cff',
                      }}
                    >
                      <Package size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Product Detail: {selectedProduct.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                        Category: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.category}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: '#31d38a' }}>
                      ${selectedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} / {selectedProduct.unit}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDetailModalOpen(false)}
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
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* FIELDS GRID */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    marginBottom: '24px',
                    fontSize: '13px',
                  }}
                >
                  <div>Product Name: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.name}</strong></div>
                  <div>Category: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.category}</strong></div>
                  <div>Base List Price: <strong className="font-mono" style={{ color: '#38d9ff' }}>${selectedProduct.price.toFixed(2)}</strong></div>

                  <div>Unit: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.unit}</strong></div>
                  <div>Tax %: <strong className="font-mono" style={{ color: '#f5f7fa' }}>{selectedProduct.taxPct}%</strong></div>
                  <div>Quantity on Hand: <strong className="font-mono" style={{ color: '#31d38a' }}>{selectedProduct.quantityOnHand} units</strong></div>

                  <div>Subscription: <strong style={{ color: selectedProduct.isSubscription ? '#38d9ff' : '#9aa8ba' }}>{selectedProduct.isSubscription ? 'Yes' : 'No'}</strong></div>
                  <div>Recurring Cycle: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.recurringCycle}</strong></div>
                  <div>Status: <span className={`badge-glass ${selectedProduct.status === 'Inactive' ? 'badge-glass-warning' : 'badge-glass-success'}`}>{selectedProduct.status}</span></div>

                  <div style={{ gridColumn: 'span 3', color: '#9aa8ba', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    Description: <span style={{ color: '#f5f7fa' }}>{selectedProduct.description}</span>
                  </div>
                </div>

                {/* SECTIONS: PRODUCT VARIANTS & COMMERCIAL PRICE LISTS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* SECTION 1: PRODUCT VARIANTS */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, marginBottom: '12px', margin: 0 }}>
                      Product Variants
                    </h4>

                    <div className="table-glass-wrapper">
                      <table className="table-glass" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>Variant Spec</th>
                            <th>SKU</th>
                            <th className="number-cell">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.variants.map((v, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: '#f5f7fa' }}>{v.name}</td>
                              <td className="font-mono" style={{ color: '#9aa8ba' }}>{v.sku}</td>
                              <td className="number-cell font-mono" style={{ fontWeight: 700 }}>
                                ${v.price.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: PRICE LISTS */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#31d38a', fontWeight: 700, marginBottom: '12px', margin: 0 }}>
                      Commercial Price Lists
                    </h4>

                    <div className="table-glass-wrapper">
                      <table className="table-glass" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>Price List Tier</th>
                            <th className="number-cell">Discount %</th>
                            <th className="number-cell">Net Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProduct.priceLists.map((pl, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 600, color: '#f5f7fa' }}>{pl.name}</td>
                              <td className="number-cell font-mono" style={{ color: '#f5b544' }}>{pl.discountPct}%</td>
                              <td className="number-cell font-mono" style={{ fontWeight: 700, color: '#31d38a' }}>
                                ${pl.netPrice.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    type="button"
                    className="btn-glass btn-glass-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      fontSize: '13px',
                      background: 'rgba(47, 140, 255, 0.25)',
                      border: '1px solid rgba(47, 140, 255, 0.5)',
                      color: '#38d9ff',
                    }}
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenEditModal(selectedProduct);
                    }}
                  >
                    <Edit size={14} /> Edit Product Values
                  </button>
                  <button
                    type="button"
                    className="btn-glass btn-glass-secondary"
                    onClick={() => setIsDetailModalOpen(false)}
                    style={{ padding: '8px 20px', fontSize: '13px' }}
                  >
                    Close Inspector
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: DISCOUNT CONFIGURATION */}
      {activeTab === 'discount-config' && (
        <form onSubmit={handleSaveDiscountConfig} className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
                Discount Governance & Approval Configuration
              </h3>
              <p style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px', margin: 0 }}>
                Configure tier limits, category limits, and automated approval routing.
              </p>
            </div>

            <button type="submit" className="btn-glass btn-glass-primary">
              <Save size={14} /> Save Configuration
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* TIER DISCOUNT LIMITS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#38d9ff', fontWeight: 700, marginBottom: '14px', margin: 0 }}>
                Tier Discount Limits
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600 }}>Bronze Tier Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass-select"
                      style={{ width: '70px', textAlign: 'right' }}
                      value={tierLimits.bronze}
                      onChange={(e) => setTierLimits({ ...tierLimits, bronze: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '12px', color: '#9aa8ba' }}>%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600 }}>Silver Tier Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass-select"
                      style={{ width: '70px', textAlign: 'right' }}
                      value={tierLimits.silver}
                      onChange={(e) => setTierLimits({ ...tierLimits, silver: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '12px', color: '#9aa8ba' }}>%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600 }}>Gold Tier Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass-select"
                      style={{ width: '70px', textAlign: 'right' }}
                      value={tierLimits.gold}
                      onChange={(e) => setTierLimits({ ...tierLimits, gold: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '12px', color: '#9aa8ba' }}>%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CATEGORY DISCOUNT LIMITS */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#f5b544', fontWeight: 700, marginBottom: '14px', margin: 0 }}>
                Category Discount Limits
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600 }}>Hardware Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass-select"
                      style={{ width: '70px', textAlign: 'right' }}
                      value={categoryLimits.hardware}
                      onChange={(e) => setCategoryLimits({ ...categoryLimits, hardware: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '12px', color: '#9aa8ba' }}>%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600 }}>Services Limit</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      className="input-glass-select"
                      style={{ width: '70px', textAlign: 'right' }}
                      value={categoryLimits.services}
                      onChange={(e) => setCategoryLimits({ ...categoryLimits, services: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: '12px', color: '#9aa8ba' }}>%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* APPROVAL MAPPING */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#31d38a', fontWeight: 700, marginBottom: '14px', margin: 0 }}>
                Approval Mapping Rules
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <label style={{ color: '#9aa8ba', display: 'block', marginBottom: '2px' }}>Within limit:</label>
                  <div style={{ fontWeight: 700, color: '#31d38a' }}>→ {approvalMapping.withinLimit}</div>
                </div>

                <div>
                  <label style={{ color: '#9aa8ba', display: 'block', marginBottom: '2px' }}>Medium risk:</label>
                  <div style={{ fontWeight: 700, color: '#f5b544' }}>→ {approvalMapping.mediumRisk}</div>
                </div>

                <div>
                  <label style={{ color: '#9aa8ba', display: 'block', marginBottom: '2px' }}>High risk:</label>
                  <div style={{ fontWeight: 700, color: '#ff6b72' }}>→ {approvalMapping.highRisk}</div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* CREATE PRODUCT MODAL OVERLAY */}
      {isCreateModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsCreateModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 12, 24, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'linear-gradient(145deg, rgba(13, 25, 48, 0.95) 0%, rgba(7, 16, 33, 0.98) 100%)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              padding: '24px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(47, 140, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2f8cff' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>Add New Product</h2>
                  <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Configure commercial SKU & pricing parameters</span>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9aa8ba', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Laptop Pro 16"
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={newProductForm.name}
                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HW-LAP-16"
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', textTransform: 'uppercase' }}
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Product Category *
                  </label>
                  <select
                    className="input-glass-select"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software Subscription">Software Subscription</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    List Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1850.00"
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={newProductForm.listPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, listPrice: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    Unit COGS ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1200.00"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={newProductForm.cogs}
                    onChange={(e) => setNewProductForm({ ...newProductForm, cogs: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    Min Margin (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="20.0"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={newProductForm.minMarginPct}
                    onChange={(e) => setNewProductForm({ ...newProductForm, minMarginPct: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    In-Stock Qty
                  </label>
                  <input
                    type="number"
                    placeholder="100"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={newProductForm.inStock}
                    onChange={(e) => setNewProductForm({ ...newProductForm, inStock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide product features, hardware specs, or subscription SLA guidelines..."
                  className="input-glass"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', resize: 'vertical' }}
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  className="btn-glass btn-glass-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-glass btn-glass-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL OVERLAY */}
      {isEditModalOpen && editingProductItem && (
        <div
          className="modal-backdrop"
          onClick={() => setIsEditModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 12, 24, 0.84)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '580px',
              borderRadius: '14px',
              border: '1px solid rgba(47, 140, 255, 0.35)',
              background: 'linear-gradient(145deg, rgba(13, 25, 48, 0.96) 0%, rgba(7, 16, 33, 0.98) 100%)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
              padding: '24px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(47, 140, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38d9ff' }}>
                  <Edit size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Edit Product Values
                  </h2>
                  <span style={{ fontSize: '12px', color: '#9aa8ba' }}>Modify catalog parameters for {editProductForm.name}</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#9aa8ba', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={editProductForm.name}
                    onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px', textTransform: 'uppercase' }}
                    value={editProductForm.sku}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    className="input-glass-select"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software Subscription">Software Subscription</option>
                    <option value="Professional Services">Professional Services</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    List Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="input-glass"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={editProductForm.listPrice}
                    onChange={(e) => setEditProductForm({ ...editProductForm, listPrice: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                    Status *
                  </label>
                  <select
                    className="input-glass-select"
                    style={{ width: '100%', padding: '9px 12px', fontSize: '13px' }}
                    value={editProductForm.status}
                    onChange={(e) => setEditProductForm({ ...editProductForm, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    Unit COGS ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={editProductForm.cogs}
                    onChange={(e) => setEditProductForm({ ...editProductForm, cogs: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    Min Margin (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={editProductForm.minMarginPct}
                    onChange={(e) => setEditProductForm({ ...editProductForm, minMarginPct: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    Default Disc (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={editProductForm.defaultDiscountPct}
                    onChange={(e) => setEditProductForm({ ...editProductForm, defaultDiscountPct: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#9aa8ba', marginBottom: '6px' }}>
                    In-Stock Qty
                  </label>
                  <input
                    type="number"
                    className="input-glass"
                    style={{ width: '100%', padding: '8px 10px', fontSize: '12px' }}
                    value={editProductForm.inStock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, inStock: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '6px' }}>
                  Description & Specifications
                </label>
                <textarea
                  rows={3}
                  className="input-glass"
                  style={{ width: '100%', padding: '9px 12px', fontSize: '13px', resize: 'vertical' }}
                  value={editProductForm.description}
                  onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  type="button"
                  className="btn-glass btn-glass-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-glass btn-glass-primary"
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2f8cff 0%, #0056b3 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Save Product Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

