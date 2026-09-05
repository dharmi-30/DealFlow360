// ─────────────────────────────────────────────────────────────────────────────
// Global shared TypeScript types for DealFlow360
// These match frontend mock services and future FastAPI response schemas.
// ─────────────────────────────────────────────────────────────────────────────

export type ID = string;
export type ISODateString = string; // e.g. "2026-09-01T00:00:00Z"

// ── Navigation ───────────────────────────────────────────────────────────────

export type NavItemId =
  | 'dashboard'
  | 'quotations'
  | 'pipeline'
  | 'quotation-builder'
  | 'approvals'
  | 'upsell'
  | 'fulfillment'
  | 'subscriptions'
  | 'invoices'
  | 'customer-portal'
  | 'deal-health'
  | 'reports'
  | 'products'
  | 'customers'
  | 'warehouses'
  | 'discount-rules'
  | 'settings'
  | 'design-system';

export interface NavItem {
  id: NavItemId;
  label: string;
  href: string;
  icon: string; // Lucide icon name
  badge?: number; // optional notification count
}

// ── User / Auth ───────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'sales_rep' | 'manager' | 'finance' | 'viewer';

export interface User {
  id: ID;
  name: string;
  email: string;
  companyName?: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  companyName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token?: string; // JWT token placeholder for future FastAPI integration
}

// ── Deals / Pipeline ─────────────────────────────────────────────────────────

export type DealStage =
  | 'lead'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export type DealPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Deal {
  id: ID;
  title: string;
  company: string;
  contactName: string;
  contactEmail: string;
  stage: DealStage;
  priority: DealPriority;
  value: number;
  currency: string;
  probability: number; // 0–100
  expectedCloseDate: ISODateString;
  assignedTo: User;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ── Shared API Models ─────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// ── Domain Re-exports ─────────────────────────────────────────────────────────
export * from './products';
export * from './customers';
export * from './configuration';
export * from './quotations';
export * from './approvals';
export * from './fulfillment';
export * from './subscriptions';
export * from './invoices';
export * from './recommendations';
export * from './dealHealth';
export * from './reports';
