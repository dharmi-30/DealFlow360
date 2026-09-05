import { UserAuthData, AccountType, UserRoleType } from '../types';
import { createRealJwtToken, decodeJwtToken, isJwtExpired, JWTPayload } from '../lib/jwt';

const BACKEND_API_URL = 'http://localhost:8000';
const JWT_TOKEN_KEY = 'df360_jwt_token';
const USER_SESSION_KEY = 'df360_user_session';

export interface LoginParams {
  email: string;
  password?: string;
  accountType: AccountType;
  fullName?: string;
  companyName?: string;
  role?: UserRoleType;
  roleTitle?: string;
  customerId?: string;
  permissions?: string[];
}

export interface AuthSessionResponse {
  user: UserAuthData;
  token: string;
  payload: JWTPayload;
}

/**
 * Authenticate user with Real JWT Token generation & FastAPI backend sync
 */
export async function authenticateWithJwt(params: LoginParams): Promise<AuthSessionResponse> {
  const {
    email,
    password = 'password123',
    accountType,
    fullName,
    companyName,
    role,
    roleTitle,
    customerId,
    permissions,
  } = params;

  let jwtToken: string | null = null;
  let responseUser: UserAuthData | null = null;

  // 1. Attempt FastAPI backend authentication if live server is reachable
  try {
    const apiRes = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        console_mode: accountType,
      }),
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      jwtToken = data.access_token;
      if (data.user) {
        responseUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.full_name,
          accountType: data.user.account_type || accountType,
          role: data.user.role,
          roleTitle: data.user.role_title || 'User',
          company: companyName || 'DealFlow360 Operations',
          permissions: data.user.permissions || [],
          token: jwtToken || undefined,
        };
      }
    }
  } catch {
    // API server offline or unreachable - seamless fallback to client-side Web Crypto JWT
  }

  // 2. Generate Real Cryptographic HS256 JWT Token if not provided by backend API
  const userRole: UserRoleType = role || (accountType === 'customer' ? 'CUSTOMER' : 'SALES_OPS_DIRECTOR');
  const userRoleTitle = roleTitle || (
    userRole === 'SALES_OPS_DIRECTOR' ? 'Sales Ops Director' :
    userRole === 'SALES_MANAGER' ? 'Sales Manager' :
    userRole === 'SALES_REP' ? 'Sales Representative' :
    userRole === 'FINANCE' ? 'Finance Controller' :
    userRole === 'ADMIN' ? 'System Administrator' : 'Customer'
  );

  const finalCompany = accountType === 'customer' ? (companyName || 'Acme Corp') : 'DealFlow360 Operations';
  const finalPermissions = permissions || (
    accountType === 'customer'
      ? ['view_portal_quotes', 'counter_offer', 'accept_quote', 'view_invoices']
      : ['all', 'approve_quotes', 'edit_margin', 'manage_fulfillment', 'manage_users', 'view_reports']
  );

  const userId = `usr-${email.split('@')[0]}-${Math.floor(Math.random() * 1000)}`;

  if (!jwtToken) {
    jwtToken = await createRealJwtToken({
      sub: userId,
      email,
      name: fullName || (accountType === 'internal' ? 'Sales Ops Director' : 'Marcus Vance'),
      account_type: accountType,
      role: userRole,
      role_title: userRoleTitle,
      company: finalCompany,
      customer_id: customerId,
      permissions: finalPermissions,
    });
  }

  // Parse claims from real JWT token
  const decoded = decodeJwtToken(jwtToken);
  if (!decoded) {
    throw new Error('Failed to parse generated JWT token');
  }

  const user: UserAuthData = responseUser || {
    id: decoded.payload.sub,
    email: decoded.payload.email,
    name: decoded.payload.name,
    accountType: decoded.payload.account_type,
    role: decoded.payload.role,
    roleTitle: decoded.payload.role_title,
    company: decoded.payload.company,
    customerId: decoded.payload.customer_id,
    permissions: decoded.payload.permissions,
    token: jwtToken,
  };

  // 3. Persist JWT token & user session in localStorage
  localStorage.setItem(JWT_TOKEN_KEY, jwtToken);
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));

  return {
    user,
    token: jwtToken,
    payload: decoded.payload,
  };
}

/**
 * Validate active JWT token session on application load
 */
export function getActiveJwtSession(): UserAuthData | null {
  try {
    const token = localStorage.getItem(JWT_TOKEN_KEY);
    if (!token) return null;

    if (isJwtExpired(token)) {
      logoutJwtSession();
      return null;
    }

    const decoded = decodeJwtToken(token);
    if (!decoded) {
      logoutJwtSession();
      return null;
    }

    const savedUserStr = localStorage.getItem(USER_SESSION_KEY);
    if (savedUserStr) {
      const parsed = JSON.parse(savedUserStr);
      return {
        ...parsed,
        token,
      };
    }

    return {
      id: decoded.payload.sub,
      email: decoded.payload.email,
      name: decoded.payload.name,
      accountType: decoded.payload.account_type,
      role: decoded.payload.role,
      roleTitle: decoded.payload.role_title,
      company: decoded.payload.company,
      customerId: decoded.payload.customer_id,
      permissions: decoded.payload.permissions,
      token,
    };
  } catch {
    logoutJwtSession();
    return null;
  }
}

/**
 * Logout and invalidate active JWT token session
 */
export function logoutJwtSession(): void {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  if (token) {
    // Notify backend logout endpoint asynchronously if reachable
    fetch(`${BACKEND_API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }).catch(() => {});
  }

  localStorage.removeItem(JWT_TOKEN_KEY);
  localStorage.removeItem(USER_SESSION_KEY);
}

/**
 * Get HTTP headers for authenticated API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(JWT_TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
