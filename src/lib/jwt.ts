/**
 * Real Cryptographic JWT (JSON Web Token) Implementation using standard Web Crypto API (HMAC-SHA256).
 * Follows RFC 7519 specification: Header.Payload.Signature
 */

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  account_type: 'internal' | 'customer';
  role: 'ADMIN' | 'SALES_OPS_DIRECTOR' | 'SALES_MANAGER' | 'SALES_REP' | 'FINANCE' | 'CUSTOMER';
  role_title: string;
  company: string;
  company_id?: string;
  customer_id?: string;
  permissions: string[];
  iat: number; // Issued at timestamp (seconds)
  exp: number; // Expiration timestamp (seconds)
  iss?: string;
}

export interface JWTHeader {
  alg: 'HS256';
  typ: 'JWT';
}

const DEFAULT_JWT_SECRET = 'dealflow360-real-jwt-secret-key-2026';

// Base64Url encoding/decoding helpers
export const base64UrlEncode = (str: string): string => {
  const base64 = btoa(str);
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

export const base64UrlDecode = (base64Url: string): string => {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
};

// Convert string to ArrayBuffer for CryptoKey
const str2ab = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Convert ArrayBuffer to Base64Url
const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
};

/**
 * Generate a real, cryptographically signed JWT token (HS256) using Web Crypto API
 */
export async function createRealJwtToken(
  payloadData: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresInSeconds: number = 86400, // Default 24h
  secret: string = DEFAULT_JWT_SECRET
): Promise<string> {
  const header: JWTHeader = { alg: 'HS256', typ: 'JWT' };
  
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    ...payloadData,
    iat: nowInSeconds,
    exp: nowInSeconds + expiresInSeconds,
    iss: 'DealFlow360-Auth-Service',
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  // Import secret key for HMAC-SHA256
  const key = await crypto.subtle.importKey(
    'raw',
    str2ab(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign with Web Crypto API
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, str2ab(dataToSign) as BufferSource);
  const encodedSignature = arrayBufferToBase64Url(signatureBuffer);

  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Parse and decode JWT token without signature check
 */
export function decodeJwtToken(token: string): { header: JWTHeader; payload: JWTPayload } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64UrlDecode(parts[0])) as JWTHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JWTPayload;

    return { header, payload };
  } catch (err) {
    console.error('Failed to decode JWT token:', err);
    return null;
  }
}

/**
 * Cryptographically verify HMAC-SHA256 signature of JWT token
 */
export async function verifyJwtSignature(
  token: string,
  secret: string = DEFAULT_JWT_SECRET
): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const dataToSign = `${parts[0]}.${parts[1]}`;
    const rawSignature = parts[2];

    const key = await crypto.subtle.importKey(
      'raw',
      str2ab(secret) as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Reconstruct binary signature
    const signatureBinary = base64UrlDecode(rawSignature);
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    return await crypto.subtle.verify('HMAC', key, signatureBytes as BufferSource, str2ab(dataToSign) as BufferSource);
  } catch {
    return false;
  }
}

/**
 * Check if JWT token is expired
 */
export function isJwtExpired(token: string): boolean {
  const decoded = decodeJwtToken(token);
  if (!decoded) return true;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return decoded.payload.exp < nowInSeconds;
}

/**
 * Format remaining time on JWT token
 */
export function getJwtRemainingTimeString(token: string): string {
  const decoded = decodeJwtToken(token);
  if (!decoded) return 'Expired';
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const diff = decoded.payload.exp - nowInSeconds;
  if (diff <= 0) return 'Expired';

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  if (minutes > 0) return `${minutes}m ${seconds}s remaining`;
  return `${seconds}s remaining`;
}
