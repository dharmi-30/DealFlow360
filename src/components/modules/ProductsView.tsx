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
} from 'lucide-react';

interface ProductsViewProps {
  products: Product[];
  onAddProduct?: (product: Product) => void;
}

interface DetailedProductItem {
  id: string;
  name: string;
  category: string;
  variantsCount: number;
  price: number;
  unit: string;
  taxPct: number;
  status: 'Active' | 'Draft' | 'Discontinued';
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

export const ProductsView: React.FC<ProductsViewProps> = ({ products = [], onAddProduct }) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'discount-config'>('catalog');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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

  // Convert schema.sql parsed products into detailed view items
  const dynamicProductList: DetailedProductItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category || 'Hardware',
    variantsCount: 3,
    price: p.listPrice,
    unit: p.category.includes('Subscription') || p.category.includes('Support') ? 'Contract' : p.category.includes('Services') ? 'Session' : 'Unit',
    taxPct: p.category.includes('Services') ? 0.0 : 8.5,
    status: 'Active',
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
  }));

  const productList = dynamicProductList.length > 0 ? dynamicProductList : EXTENDED_PRODUCTS;
  const [selectedProduct, setSelectedProduct] = useState<DetailedProductItem>(productList[0]);

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
    setIsCreateModalOpen(false);
    setNewProductForm({
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
    setSaveNotice(`Product "${createdProduct.name}" (${createdProduct.sku}) created and added to commercial catalog.`);
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
                  Click row to view Product Detail inspector
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

            <div className="table-glass-wrapper">
              <table className="table-glass">
                <thead>
                  <tr>
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
                    const isSelected = item.id === selectedProduct.id;
                    return (
                      <tr
                        key={item.id}
                        className={`clickable ${isSelected ? 'row-selected' : ''}`}
                        onClick={() => setSelectedProduct(item)}
                        style={{
                          background: isSelected ? 'rgba(47, 140, 255, 0.12)' : undefined,
                        }}
                      >
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
                          <span className="badge-glass badge-glass-success">{item.status}</span>
                        </td>
                        <td className="number-cell">
                          <button
                            className="btn-glass btn-glass-secondary btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(item);
                            }}
                          >
                            Inspect <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRODUCT DETAIL INSPECTOR PANEL */}
          {selectedProduct && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
                    Product Detail: {selectedProduct.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                    Category: <strong style={{ color: '#f5f7fa' }}>{selectedProduct.category}</strong>
                  </div>
                </div>

                <div className="font-mono" style={{ fontSize: '20px', fontWeight: 800, color: '#31d38a' }}>
                  ${selectedProduct.price.toLocaleString('en-US', { minimumFractionDigits: 2 })} / {selectedProduct.unit}
                </div>
              </div>

              {/* FIELDS GRID */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '16px',
                  borderRadius: '8px',
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
                <div style={{ gridColumn: 'span 3', color: '#9aa8ba', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  Description: <span style={{ color: '#f5f7fa' }}>{selectedProduct.description}</span>
                </div>
              </div>

              {/* SECTIONS: PRODUCT VARIANTS & PRICE LISTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* SECTION 1: PRODUCT VARIANTS */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
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
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
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
    </div>
  );
};

