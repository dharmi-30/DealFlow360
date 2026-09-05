import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, User, Building, ShieldCheck, CheckCircle2, KeyRound } from 'lucide-react';

export interface UserAuthData {
  email: string;
  name: string;
  role: 'internal' | 'customer';
  company?: string;
}

interface AuthViewProps {
  onLoginSuccess: (user: UserAuthData) => void;
  initialMode?: 'login' | 'signup' | 'forgot_password';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  
  // Login & Signup Form States
  const [email, setEmail] = useState('rahul@dealflow360.com');
  const [password, setPassword] = useState('••••••••••••');
  const [fullName, setFullName] = useState('Rahul Sharma');
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [role, setRole] = useState<'internal' | 'customer'>('internal');
  
  // Feedback states
  const [isResetSent, setIsResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleToggle = (selectedRole: 'internal' | 'customer') => {
    setRole(selectedRole);
    if (selectedRole === 'internal') {
      setEmail('rahul@dealflow360.com');
      setFullName('Rahul Sharma');
    } else {
      setEmail('m.vance@acme-corp.com');
      setFullName('Marcus Vance');
      setCompanyName('Acme Corp');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      if (mode === 'login' || mode === 'signup') {
        const userObj: UserAuthData = {
          email,
          name: fullName || (role === 'internal' ? 'Rahul Sharma' : 'Marcus Vance'),
          role,
          company: role === 'customer' ? companyName : 'DealFlow360 Operations',
        };
        onLoginSuccess(userObj);
      } else if (mode === 'forgot_password') {
        setIsResetSent(true);
      }
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '460px',
          maxWidth: '100%',
          padding: '36px 32px',
          margin: 0,
          boxShadow: 'var(--shadow-glass-lg), 0 0 50px rgba(47, 140, 255, 0.15)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand-icon-glass" style={{ width: '44px', height: '44px', borderRadius: '12px', marginBottom: '12px' }}>
            <Layers size={24} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f5f7fa', letterSpacing: '-0.02em' }}>DealFlow360</h1>
          <p style={{ fontSize: '12px', color: '#9aa8ba', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '4px' }}>
            Quote. Approve. Fulfil. Grow.
          </p>
        </div>

        {/* Role Selector Toggle (Login / Signup) */}
        {mode !== 'forgot_password' && (
          <div style={{ display: 'flex', background: 'rgba(7, 17, 31, 0.7)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '3px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => handleRoleToggle('internal')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                background: role === 'internal' ? '#2f8cff' : 'transparent',
                color: role === 'internal' ? '#ffffff' : '#9aa8ba',
                transition: 'all 0.15s ease',
              }}
            >
              Sales Ops Console
            </button>

            <button
              type="button"
              onClick={() => handleRoleToggle('customer')}
              style={{
                flex: 1,
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                background: role === 'customer' ? '#2f8cff' : 'transparent',
                color: role === 'customer' ? '#ffffff' : '#9aa8ba',
                transition: 'all 0.15s ease',
              }}
            >
              Customer Procurement
            </button>
          </div>
        )}

        {/* Success Banner for Forgot Password */}
        {mode === 'forgot_password' && isResetSent && (
          <div
            style={{
              background: 'rgba(49, 211, 138, 0.12)',
              border: '1px solid rgba(49, 211, 138, 0.3)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: '#31d38a',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Password Reset Link Sent!</strong>
              <div style={{ fontSize: '12px', color: '#9aa8ba', marginTop: '2px' }}>
                Instructions have been sent to <strong>{email}</strong>.
              </div>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Mode Title */}
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa', marginBottom: '4px' }}>
            {mode === 'login' && `Log in to ${role === 'internal' ? 'Sales Ops Console' : 'Customer Portal'}`}
            {mode === 'signup' && `Create your ${role === 'internal' ? 'Sales Ops' : 'Customer'} account`}
            {mode === 'forgot_password' && 'Reset your password'}
          </div>

          {/* Signup Name Field */}
          {mode === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input
                  type="text"
                  className="input-glass-select"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          {/* Signup Company Name Field */}
          {mode === 'signup' && role === 'customer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Organization / Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input
                  type="text"
                  className="input-glass-select"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Work Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
              <input
                type="email"
                className="input-glass-select"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                style={{ width: '100%', paddingLeft: '36px' }}
              />
            </div>
          </div>

          {/* Password Field (Login & Signup) */}
          {mode !== 'forgot_password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setIsResetSent(false);
                    }}
                    style={{ fontSize: '12px', color: '#38d9ff', background: 'none' }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
                <input
                  type="password"
                  className="input-glass-select"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{ width: '100%', paddingLeft: '36px' }}
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="btn-glass btn-glass-primary"
            disabled={isLoading}
            style={{ width: '100%', marginTop: '8px', padding: '11px 16px' }}
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <span>Log In to {role === 'internal' ? 'Console' : 'Portal'}</span>
                <ArrowRight size={15} />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Create Account</span>
                <ArrowRight size={15} />
              </>
            ) : (
              <>
                <KeyRound size={15} />
                <span>Send Password Reset Link</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: '13px', color: '#9aa8ba' }}>
          {mode === 'login' && (
            <span>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                style={{ color: '#38d9ff', fontWeight: 600, background: 'none' }}
              >
                Sign Up
              </button>
            </span>
          )}

          {mode === 'signup' && (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                style={{ color: '#38d9ff', fontWeight: 600, background: 'none' }}
              >
                Log In
              </button>
            </span>
          )}

          {mode === 'forgot_password' && (
            <span>
              Remember your password?{' '}
              <button
                onClick={() => {
                  setMode('login');
                  setIsResetSent(false);
                }}
                style={{ color: '#38d9ff', fontWeight: 600, background: 'none' }}
              >
                Back to Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
