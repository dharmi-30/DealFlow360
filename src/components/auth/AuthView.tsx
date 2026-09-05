import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, User, Building, ShieldCheck, CheckCircle2, KeyRound, Briefcase, UserCheck } from 'lucide-react';
import { UserAuthData, AccountType, UserRoleType } from '../../types';

interface AuthViewProps {
  onLoginSuccess: (user: UserAuthData) => void;
  initialMode?: 'login' | 'signup' | 'forgot_password';
}

// Pre-configured demo personas to allow quick seamless testing across roles
const DEMO_PERSONAS: Record<AccountType, Array<{
  email: string;
  name: string;
  role: UserRoleType;
  roleTitle: string;
  company: string;
  customerId?: string;
  permissions: string[];
}>> = {
  internal: [
    {
      email: 'rahul@dealflow360.com',
      name: 'Rahul Sharma',
      role: 'SALES_OPS_DIRECTOR',
      roleTitle: 'Sales Ops Director',
      company: 'DealFlow360 Operations',
      permissions: ['all', 'approve_quotes', 'edit_margin', 'manage_fulfillment', 'manage_users', 'view_reports'],
    },
    {
      email: 'a.morgan@dealflow360.com',
      name: 'Alex Morgan',
      role: 'SALES_MANAGER',
      roleTitle: 'Sales Manager',
      company: 'DealFlow360 Operations',
      permissions: ['approve_quotes', 'view_all_quotes', 'manage_fulfillment', 'view_reports'],
    },
    {
      email: 's.jenkins@dealflow360.com',
      name: 'Sarah Jenkins',
      role: 'SALES_REP',
      roleTitle: 'Sales Representative',
      company: 'DealFlow360 Operations',
      permissions: ['create_quotes', 'view_own_quotes', 'negotiate'],
    },
    {
      email: 'finance@dealflow360.com',
      name: 'Finance Controller',
      role: 'FINANCE',
      roleTitle: 'Finance Controller',
      company: 'DealFlow360 Operations',
      permissions: ['approve_financials', 'manage_invoices', 'view_reports'],
    },
  ],
  customer: [
    {
      email: 'm.vance@acme-corp.com',
      name: 'Marcus Vance',
      role: 'CUSTOMER',
      roleTitle: 'Procurement Lead',
      company: 'Acme Corp',
      customerId: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      permissions: ['view_portal_quotes', 'counter_offer', 'accept_quote', 'view_invoices'],
    },
    {
      email: 'e.rostova@betaind.com',
      name: 'Elena Rostova',
      role: 'CUSTOMER',
      roleTitle: 'VP Procurement',
      company: 'Beta Industries',
      customerId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      permissions: ['view_portal_quotes', 'counter_offer', 'accept_quote', 'view_invoices'],
    },
    {
      email: 'r.thorne@zenithco.io',
      name: 'Robert Thorne',
      role: 'CUSTOMER',
      roleTitle: 'Operations Manager',
      company: 'Zenith Co',
      customerId: 'c3eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      permissions: ['view_portal_quotes', 'counter_offer', 'accept_quote'],
    },
  ],
};

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>(initialMode);
  
  // Login Console Selection: 'internal' (Sales Ops Console) | 'customer' (Customer Portal)
  const [accountType, setAccountType] = useState<AccountType>('internal');

  // Selected Demo Persona index or custom entry
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState<number>(0);
  
  // Form Input States
  const [email, setEmail] = useState<string>(DEMO_PERSONAS.internal[0].email);
  const [password, setPassword] = useState<string>('••••••••••••');
  const [fullName, setFullName] = useState<string>(DEMO_PERSONAS.internal[0].name);
  const [companyName, setCompanyName] = useState<string>(DEMO_PERSONAS.internal[0].company);
  const [internalRole, setInternalRole] = useState<UserRoleType>('SALES_OPS_DIRECTOR');

  // Feedback states
  const [isResetSent, setIsResetSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type);
    setSelectedPersonaIdx(0);
    setErrorMessage(null);

    const firstPersona = DEMO_PERSONAS[type][0];
    setEmail(firstPersona.email);
    setFullName(firstPersona.name);
    setCompanyName(firstPersona.company);
    if (type === 'internal') {
      setInternalRole(firstPersona.role);
    }
  };

  const handlePersonaClick = (idx: number) => {
    setSelectedPersonaIdx(idx);
    const persona = DEMO_PERSONAS[accountType][idx];
    setEmail(persona.email);
    setFullName(persona.name);
    setCompanyName(persona.company);
    if (accountType === 'internal') {
      setInternalRole(persona.role);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);

      if (mode === 'login' || mode === 'signup') {
        // Find matching predefined persona or construct dynamic user auth data
        const matchedPersona = DEMO_PERSONAS[accountType].find(
          (p) => p.email.toLowerCase() === email.toLowerCase()
        );

        let roleTitle = 'User';
        let role: UserRoleType = accountType === 'customer' ? 'CUSTOMER' : internalRole;

        if (accountType === 'customer') {
          roleTitle = 'Customer';
        } else {
          if (role === 'SALES_OPS_DIRECTOR') roleTitle = 'Sales Ops Director';
          else if (role === 'SALES_MANAGER') roleTitle = 'Sales Manager';
          else if (role === 'SALES_REP') roleTitle = 'Sales Representative';
          else if (role === 'FINANCE') roleTitle = 'Finance Controller';
          else if (role === 'ADMIN') roleTitle = 'System Administrator';
        }

        const userObj: UserAuthData = {
          id: matchedPersona ? `usr-${matchedPersona.email.split('@')[0]}` : `usr-${Date.now()}`,
          email,
          name: fullName || matchedPersona?.name || (accountType === 'internal' ? 'Sales Ops User' : 'Customer Account'),
          accountType,
          role: matchedPersona ? matchedPersona.role : role,
          roleTitle: matchedPersona ? matchedPersona.roleTitle : roleTitle,
          company: accountType === 'customer' ? (companyName || matchedPersona?.company || 'Acme Corp') : 'DealFlow360 Operations',
          customerId: matchedPersona?.customerId || (accountType === 'customer' ? 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' : undefined),
          permissions: matchedPersona
            ? matchedPersona.permissions
            : accountType === 'customer'
            ? ['view_portal_quotes', 'counter_offer', 'accept_quote', 'view_invoices']
            : ['create_quotes', 'view_all_quotes', 'approve_quotes'],
          token: `jwt-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };

        onLoginSuccess(userObj);
      } else if (mode === 'forgot_password') {
        setIsResetSent(true);
      }
    }, 500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
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
          width: '500px',
          maxWidth: '100%',
          padding: '36px 32px',
          margin: 0,
          boxShadow: 'var(--shadow-glass-lg), 0 0 60px rgba(47, 140, 255, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-icon-glass" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '12px' }}>
            <Layers size={26} />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f5f7fa', letterSpacing: '-0.02em' }}>DealFlow360</h1>
          <p style={{ fontSize: '12px', color: '#9aa8ba', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>
            Quote &bull; Approve &bull; Fulfil &bull; Grow
          </p>
        </div>

        {/* REQUIREMENT 1: Login Screen - Exactly Two Clear Login Options */}
        {mode !== 'forgot_password' && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#9aa8ba', marginBottom: '8px', letterSpacing: '0.05em' }}>
              Select Login Portal Option
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                background: 'rgba(7, 17, 31, 0.7)',
                border: '1px solid var(--border-glass)',
                borderRadius: '10px',
                padding: '4px',
              }}
            >
              <button
                type="button"
                onClick={() => handleAccountTypeSelect('internal')}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: accountType === 'internal' ? 'linear-gradient(135deg, #2f8cff, #2563eb)' : 'transparent',
                  color: accountType === 'internal' ? '#ffffff' : '#9aa8ba',
                  boxShadow: accountType === 'internal' ? '0 4px 12px rgba(47, 140, 255, 0.3)' : 'none',
                  border: accountType === 'internal' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <Briefcase size={16} />
                <span>Sales Ops Console</span>
              </button>

              <button
                type="button"
                onClick={() => handleAccountTypeSelect('customer')}
                style={{
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '8px',
                  background: accountType === 'customer' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
                  color: accountType === 'customer' ? '#ffffff' : '#9aa8ba',
                  boxShadow: accountType === 'customer' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  border: accountType === 'customer' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <UserCheck size={16} />
                <span>Customer Portal</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Demo Persona Chips for instant selection */}
        {mode === 'login' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>
              Quick Select {accountType === 'internal' ? 'Sales Ops User' : 'Customer Account'}:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {DEMO_PERSONAS[accountType].map((p, idx) => (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handlePersonaClick(idx)}
                  style={{
                    fontSize: '11px',
                    fontWeight: selectedPersonaIdx === idx ? 700 : 500,
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: selectedPersonaIdx === idx
                      ? (accountType === 'internal' ? 'rgba(47, 140, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                      : 'rgba(255, 255, 255, 0.04)',
                    border: selectedPersonaIdx === idx
                      ? (accountType === 'internal' ? '1px solid rgba(47, 140, 255, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)')
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    color: selectedPersonaIdx === idx
                      ? (accountType === 'internal' ? '#38d9ff' : '#34d399')
                      : '#9aa8ba',
                    cursor: 'pointer',
                  }}
                >
                  {p.name} ({accountType === 'internal' ? p.roleTitle : p.company})
                </button>
              ))}
            </div>
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
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f5f7fa' }}>
            {mode === 'login' && (
              accountType === 'internal'
                ? 'Sales Ops Console Authentication'
                : 'Customer Portal Procurement Login'
            )}
            {mode === 'signup' && (
              accountType === 'internal'
                ? 'Create Sales Ops Staff Account'
                : 'Register Customer Organization'
            )}
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

          {/* Signup Role (Internal) */}
          {mode === 'signup' && accountType === 'internal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#9aa8ba' }}>Internal Role</label>
              <select
                className="input-glass-select"
                value={internalRole}
                onChange={(e) => setInternalRole(e.target.value as UserRoleType)}
                style={{ width: '100%' }}
              >
                <option value="SALES_OPS_DIRECTOR">Sales Ops Director</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_REP">Sales Representative</option>
                <option value="FINANCE">Finance / Operations</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          )}

          {/* Signup Company Name Field */}
          {mode === 'signup' && accountType === 'customer' && (
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
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '12px 16px',
              background: accountType === 'customer'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #2f8cff, #2563eb)',
            }}
          >
            {isLoading ? (
              <span>Authenticating Session...</span>
            ) : mode === 'login' ? (
              <>
                <span>Log In to {accountType === 'internal' ? 'Sales Ops Console' : 'Customer Portal'}</span>
                <ArrowRight size={15} />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Create {accountType === 'internal' ? 'Sales Ops' : 'Customer'} Account</span>
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
