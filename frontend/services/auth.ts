/**
 * Authentication Service Abstraction
 *
 * Provides placeholder auth methods (login, signup, logout, getCurrentUser).
 * Currently operates in mock mode for frontend testing and navigation,
 * designed for seamless integration with FastAPI REST endpoints in Phase 2.
 */

import type { User, LoginPayload, SignupPayload, AuthResponse } from '@/types';

const MOCK_USER_STORAGE_KEY = 'dealflow_mock_user';

export const authService = {
  /**
   * Placeholder login function.
   * Simulates network latency and returns a mock AuthResponse.
   */
  async login(credentials: LoginPayload): Promise<AuthResponse> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user: User = {
      id: 'usr_mock_101',
      name: credentials.email.split('@')[0].replace('.', ' '),
      email: credentials.email,
      companyName: 'Acme Sales Ops',
      role: 'manager',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
    }

    return {
      user,
      token: 'mock_jwt_token_dealflow360_phase1',
    };
  },

  /**
   * Placeholder signup function.
   * Creates a mock user profile and stores it locally for testing.
   */
  async signup(payload: SignupPayload): Promise<AuthResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const user: User = {
      id: `usr_${Date.now()}`,
      name: payload.name,
      email: payload.email,
      companyName: payload.companyName,
      role: payload.role,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(user));
    }

    return {
      user,
      token: 'mock_jwt_token_dealflow360_phase1',
    };
  },

  /**
   * Logout function. Clears session state.
   */
  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    }
  },

  /**
   * Synchronously retrieve current mock user from storage.
   */
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  },
};
