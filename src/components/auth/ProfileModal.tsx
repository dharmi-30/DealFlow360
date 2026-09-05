import React, { useState } from 'react';
import { UserAuthData } from '../../types';
import { Shield, Lock, CheckCircle, X, Key, Copy, Check } from 'lucide-react';
import { decodeJwtToken, getJwtRemainingTimeString } from '../../lib/jwt';

interface ProfileModalProps {
  user: UserAuthData;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'jwt'>('details');

  const decodedJwt = user.token ? decodeJwtToken(user.token) : null;
  const remainingTime = user.token ? getJwtRemainingTimeString(user.token) : '24 hours remaining';

  const handleCopyToken = () => {
    if (user.token) {
      navigator.clipboard.writeText(user.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 15, 26, 0.8)',
        backdropFilter: 'blur(10px)',
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
          width: '580px',
          maxWidth: '100%',
          padding: '28px',
          borderRadius: '16px',
          position: 'relative',
          boxShadow: 'var(--shadow-glass-lg), 0 0 60px rgba(47, 140, 255, 0.22)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
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

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '18px', paddingBottom: '8px' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              background: activeTab === 'details' ? 'rgba(47, 140, 255, 0.2)' : 'transparent',
              color: activeTab === 'details' ? '#38d9ff' : '#9aa8ba',
              border: activeTab === 'details' ? '1px solid rgba(47, 140, 255, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            User Details & RBAC
          </button>
          <button
            onClick={() => setActiveTab('jwt')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              background: activeTab === 'jwt' ? 'rgba(47, 140, 255, 0.2)' : 'transparent',
              color: activeTab === 'jwt' ? '#38d9ff' : '#9aa8ba',
              border: activeTab === 'jwt' ? '1px solid rgba(47, 140, 255, 0.4)' : '1px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
          >
            <Key size={14} />
            Cryptographic JWT Token
          </button>
        </div>

        {/* TAB 1: USER DETAILS */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
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
                  Role & Title
                </div>
                <div style={{ fontSize: '13px', color: '#38d9ff', fontWeight: 700, marginTop: '2px' }}>
                  {user.roleTitle} ({user.role})
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Organization / Tenant
                </div>
                <div style={{ fontSize: '13px', color: '#f5f7fa', fontWeight: 600, marginTop: '2px' }}>
                  {user.company}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                  Subject / User ID
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

            {/* Session Security Banner */}
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
                  JWT Authenticated &bull; {remainingTime}
                </span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>HS256 Verified</span>
            </div>
          </div>
        )}

        {/* TAB 2: JWT DECODER & TOKEN DISPLAY */}
        {activeTab === 'jwt' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {/* Raw Token Box */}
            <div style={{ background: 'rgba(7, 17, 31, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38d9ff' }}>
                  Raw JWT Access Token (RFC 7519)
                </span>
                <button
                  onClick={handleCopyToken}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: copiedToken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                    color: copiedToken ? '#34d399' : '#9aa8ba',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {copiedToken ? <Check size={12} /> : <Copy size={12} />}
                  {copiedToken ? 'Copied!' : 'Copy Token'}
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: '#34d399',
                  wordBreak: 'break-all',
                  maxHeight: '70px',
                  overflowY: 'auto',
                  lineHeight: '1.4',
                  background: 'rgba(0,0,0,0.3)',
                  padding: '8px',
                  borderRadius: '6px',
                }}
              >
                {user.token || 'No active JWT token found'}
              </div>
            </div>

            {/* Decoded Claims & Header */}
            {decodedJwt && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                {/* Header */}
                <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#ff6b72', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Header (Algorithm & Type)
                  </div>
                  <pre style={{ fontSize: '11px', color: '#f5f7fa', margin: 0, fontFamily: 'monospace' }}>
                    {JSON.stringify(decodedJwt.header, null, 2)}
                  </pre>
                </div>

                {/* Payload Claims */}
                <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#38d9ff', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Payload Claims
                  </div>
                  <pre style={{ fontSize: '10px', color: '#cbd5e1', margin: 0, fontFamily: 'monospace', maxHeight: '120px', overflowY: 'auto' }}>
                    {JSON.stringify(decodedJwt.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

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
