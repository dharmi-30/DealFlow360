import React from 'react';
import { UserAuthData } from '../../types';
import { Shield, User, Building, Lock, CheckCircle, X, Key, Calendar } from 'lucide-react';

interface ProfileModalProps {
  user: UserAuthData;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 15, 26, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '540px',
          maxWidth: '100%',
          padding: '28px',
          borderRadius: '16px',
          position: 'relative',
          boxShadow: 'var(--shadow-glass-lg), 0 0 50px rgba(47, 140, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9aa8ba',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Profile Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '16px',
              background:
                user.accountType === 'customer'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #2f8cff, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '22px',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(47, 140, 255, 0.3)',
            }}
          >
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f5f7fa', margin: 0 }}>
                {user.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background:
                    user.accountType === 'customer'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(47, 140, 255, 0.15)',
                  color: user.accountType === 'customer' ? '#34d399' : '#38d9ff',
                  border: `1px solid ${
                    user.accountType === 'customer'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(56, 217, 255, 0.3)'
                  }`,
                }}
              >
                {user.accountType === 'customer' ? 'Customer Account' : 'Internal Sales Ops'}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#9aa8ba', marginTop: '2px' }}>
              {user.roleTitle} &bull; {user.company}
            </p>
          </div>
        </div>

        {/* Detailed Session & Identity Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              background: 'rgba(7, 17, 31, 0.6)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Work Email
              </div>
              <div style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600, marginTop: '2px', wordBreak: 'break-all' }}>
                {user.email}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                User Role
              </div>
              <div style={{ fontSize: '13px', color: '#38d9ff', fontWeight: 700, marginTop: '2px' }}>
                {user.roleTitle}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                Organization / Company
              </div>
              <div style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600, marginTop: '2px' }}>
                {user.company}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                User ID
              </div>
              <div style={{ fontSize: '12px', color: '#9aa8ba', fontFamily: 'monospace', marginTop: '2px' }}>
                {user.id}
              </div>
            </div>
          </div>

          {/* Active Security Permissions */}
          <div
            style={{
              background: 'rgba(7, 17, 31, 0.6)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Shield size={16} style={{ color: '#38d9ff' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f5f7fa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Active RBAC Permissions
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {user.permissions.map((perm, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={12} style={{ color: '#10b981' }} />
                  {perm}
                </span>
              ))}
            </div>
          </div>

          {/* Session Token Security Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              fontSize: '12px',
              color: '#34d399',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={15} />
              <span>
                Session Authenticated & Protected &bull; Token valid for 24 hours
              </span>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.8 }}>JWT Active</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn-glass"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
