import React from 'react';
import { ViewMode } from '../../types';
import { UserAuthData } from '../auth/AuthView';
import {
  Layers,
  Search,
  ExternalLink,
  Bell,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenSearch: () => void;
  pendingApprovalsCount: number;
  user: UserAuthData | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onOpenSearch,
  pendingApprovalsCount,
  user,
  onLogout,
}) => {
  return (
    <header className="top-header-glass">
      <div className="header-left">
        <a href="#" className="brand-block" onClick={(e) => e.preventDefault()}>
          <div className="brand-icon-glass">
            <Layers size={18} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">DealFlow360</span>
            <span className="brand-tagline">Quote. Approve. Fulfil. Grow.</span>
          </div>
        </a>
      </div>

      {/* Center Global Search Trigger */}
      {viewMode === 'internal' && (
        <div className="header-search-bar" onClick={onOpenSearch}>
          <Search size={14} style={{ color: '#38d9ff' }} />
          <input
            type="text"
            readOnly
            placeholder="Search quotations, customers, products..."
          />
          <div className="kbd-shortcut">⌘ K</div>
        </div>
      )}

      {/* Right Controls */}
      <div className="header-right">
        {/* View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(7, 17, 31, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '2px' }}>
          <button
            className={`toggle-btn ${viewMode === 'internal' ? 'active' : ''}`}
            onClick={() => setViewMode('internal')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: viewMode === 'internal' ? '#2f8cff' : 'transparent',
              color: viewMode === 'internal' ? '#ffffff' : '#9aa8ba',
            }}
          >
            Sales Ops Console
          </button>
          <button
            className={`toggle-btn ${viewMode === 'customer' ? 'active' : ''}`}
            onClick={() => setViewMode('customer')}
            style={{
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              backgroundColor: viewMode === 'customer' ? '#2f8cff' : 'transparent',
              color: viewMode === 'customer' ? '#ffffff' : '#9aa8ba',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={12} />
            Customer Portal (Acme)
          </button>
        </div>

        {/* Notifications Icon */}
        <button
          style={{
            position: 'relative',
            color: '#9aa8ba',
            padding: '6px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Bell size={16} />
          {pendingApprovalsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '8px',
                height: '8px',
                backgroundColor: '#ff6b72',
                borderRadius: '50%',
                boxShadow: '0 0 6px #ff6b72',
              }}
            />
          )}
        </button>

        {/* User Profile & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #2f8cff, #8b5cf6)',
              color: '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px',
            }}
          >
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'RJ'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#f5f7fa' }}>
              {user?.name || 'Rahul Sharma'}
            </span>
            <span style={{ fontSize: '11px', color: '#9aa8ba' }}>
              {user?.role === 'customer' ? `${user.company || 'Acme Corp'} Buyer` : 'Sales Ops Director'}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            style={{
              color: '#9aa8ba',
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              marginLeft: '4px',
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
