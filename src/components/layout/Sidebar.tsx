import React from 'react';
import { ModuleType } from '../../types';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Truck,
  Repeat,
  Receipt,
  Activity,
  BarChart3,
  Package,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  pendingApprovalsCount,
}) => {
  const navItems: { id: ModuleType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'quotations', label: 'Quotations', icon: <FileText size={16} /> },
    {
      id: 'approvals',
      label: 'Approvals',
      icon: <CheckSquare size={16} />,
      count: pendingApprovalsCount,
    },
    { id: 'fulfillment', label: 'Fulfillment', icon: <Truck size={16} /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Repeat size={16} /> },
    { id: 'invoices', label: 'Invoices', icon: <Receipt size={16} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
    { id: 'products', label: 'Products', icon: <Package size={16} /> },
  ];

  return (
    <aside className="sidebar-glass">
      <div className="nav-section">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={() => setActiveModule(item.id)}
          >
            <div className="nav-item-left">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.count !== undefined && item.count > 0 && (
              <span
                style={{
                  backgroundColor: '#ff6b72',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '9999px',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="sidebar-promo-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={14} style={{ color: '#38d9ff' }} />
          <div className="sidebar-promo-title">Turn quotes into growth.</div>
        </div>
        <div className="sidebar-promo-sub">
          Smarter deals.<br />Happier customers.
        </div>
      </div>
    </aside>
  );
};
