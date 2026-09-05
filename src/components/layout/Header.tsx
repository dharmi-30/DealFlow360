import React, { useState, useRef, useEffect } from 'react';
import { ViewMode, UserAuthData } from '../../types';
import {
  Layers,
  Search,
  ExternalLink,
  Bell,
  LogOut,
  ChevronDown,
  User,
  ShieldCheck,
  Check,
  Lock,
  Building,
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenSearch: () => void;
  pendingApprovalsCount: number;
  user: UserAuthData | null;
  onLogout: () => void;
  onOpenProfileModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onOpenSearch,
  pendingApprovalsCount,
  user,
  onLogout,
  onOpenProfileModal,
}) => {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isCustomer = user?.accountType === 'customer';

  // Format initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="top-header-glass">
      <div className="header-left">
        <a href="#" className="brand-block" onClick={(e) => e.preventDefault()}>
          <div className="brand-icon-glass">
            <Layers size={18} />
          </div>
          <div className="brand-titles">
            <span className="brand-name">DealFlow360</span>
            <span className="brand-tagline">Quote &bull; Approve &bull; Fulfil &bull; Grow</span>
          </div>
        </a>
      </div>

      {/* Center Global Search Trigger (Internal View Only) */}
      {!isCustomer && viewMode === 'internal' && (
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
      <div className="header-right" style={{ gap: '14px' }}>
        {/* REQUIREMENT 4: Workspace Status Pills Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(7, 17, 31, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '2px',
          }}
        >
          {isCustomer ? (
            /* Customer is strictly limited to Customer Portal */
            <div
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ExternalLink size={12} />
              <span>Customer Portal ({user?.company || 'Acme Corp'})</span>
            </div>
          ) : (
            /* Internal User workspace selector */
            <>
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
                  cursor: 'pointer',
                  border: 'none',
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
                  backgroundColor: viewMode === 'customer' ? '#10b981' : 'transparent',
                  color: viewMode === 'customer' ? '#ffffff' : '#9aa8ba',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <ExternalLink size={12} />
                Customer Portal
              </button>
            </>
          )}
        </div>

        {/* Notifications Icon (Sales Ops view) */}
        {!isCustomer && (
          <button
            style={{
              position: 'relative',
              color: '#9aa8ba',
              padding: '6px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
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
        )}

        {/* REQUIREMENTS 2, 3, 4, 5, 8: Dynamic Authenticated Profile Badge & Dropdown in Top-Right */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: isProfileDropdownOpen
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '4px 10px 4px 6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Profile Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                background: isCustomer
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #2f8cff, #8b5cf6)',
                color: '#ffffff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '13px',
                boxShadow: isCustomer
                  ? '0 2px 8px rgba(16, 185, 129, 0.3)'
                  : '0 2px 8px rgba(47, 140, 255, 0.3)',
              }}
            >
              {getInitials(user?.name)}
            </div>

            {/* Profile Text Display */}
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5f7fa', lineHeight: '1.2' }}>
                {user?.name || (isCustomer ? 'Customer User' : 'Rahul Sharma')}
              </span>
              <span style={{ fontSize: '11px', color: isCustomer ? '#34d399' : '#9aa8ba', lineHeight: '1.2' }}>
                {isCustomer
                  ? `${user?.company || 'Acme Corp'} — Customer`
                  : `${user?.roleTitle || 'Sales Ops Director'}`}
              </span>
            </div>

            <ChevronDown size={14} style={{ color: '#9aa8ba', marginLeft: '4px' }} />
          </button>

          {/* REQUIREMENT 5: Workspace & Profile Dropdown Menu */}
          {isProfileDropdownOpen && (
            <div
              className="glass-panel"
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '260px',
                padding: '8px',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(47, 140, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                zIndex: 1000,
              }}
            >
              {/* User Identity Info Header */}
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(7, 17, 31, 0.6)',
                  borderRadius: '8px',
                  marginBottom: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f5f7fa' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '11px', color: '#9aa8ba', marginTop: '2px' }}>
                  {user?.email}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isCustomer ? '#34d399' : '#38d9ff',
                    marginTop: '6px',
                  }}
                >
                  <ShieldCheck size={12} />
                  {user?.roleTitle}
                </div>
              </div>

              {/* My Profile Action */}
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  onOpenProfileModal();
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#f5f7fa',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={14} style={{ color: '#38d9ff' }} />
                <span>My Profile & Session</span>
              </button>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 0' }} />

              {/* REQUIREMENT 5: Workspace Switcher */}
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Workspaces
              </div>

              {/* For Authorized Internal Users: */}
              {!isCustomer ? (
                <>
                  <button
                    onClick={() => {
                      setViewMode('internal');
                      setIsProfileDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: viewMode === 'internal' ? '#38d9ff' : '#f5f7fa',
                      background: viewMode === 'internal' ? 'rgba(47, 140, 255, 0.12)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Sales Ops Console</span>
                    {viewMode === 'internal' && <Check size={14} style={{ color: '#38d9ff' }} />}
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('internal');
                      setIsProfileDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#9aa8ba',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span>Admin Portal</span>
                  </button>

                  <button
                    onClick={() => {
                      setViewMode('customer');
                      setIsProfileDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: viewMode === 'customer' ? '#34d399' : '#f5f7fa',
                      background: viewMode === 'customer' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span>Customer Portal</span>
                    {viewMode === 'customer' && <Check size={14} style={{ color: '#34d399' }} />}
                  </button>
                </>
              ) : (
                /* For Customer Users: Strictly limited to Customer Portal ONLY */
                <>
                  <button
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#34d399',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: 'none',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'default',
                    }}
                  >
                    <span>Customer Portal</span>
                    <Check size={14} style={{ color: '#34d399' }} />
                  </button>
                </>
              )}

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '6px 0' }} />

              {/* Logout Action */}
              <button
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ff6b72',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 107, 114, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
