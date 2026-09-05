/**
 * API Service Layer
 *
 * Stub fetch wrapper that will connect to the FastAPI REST backend.
 * Currently no endpoints are called — this file provides the pattern
 * so future developers can add endpoints without changing the architecture.
 *
 * Usage (future):
 *   const deals = await apiClient.get<Deal[]>('/deals');
 */

import { config } from '@/lib/config';
import type { ApiError } from '@/types';

// ── Internal fetch helper ──────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.apiUrl}${path}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = {
      message: `API request failed: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json() as Promise<T>;
}

// ── Public API client ─────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'GET', ...options });
  },

  post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },

  put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return request<T>(path, { method: 'DELETE', ...options });
  },
};

// ── Endpoint stubs (will be implemented when FastAPI is ready) ────────────────
// Example:
// export const dealsService = {
//   list: () => apiClient.get<PaginatedResponse<Deal>>('/deals'),
//   getById: (id: string) => apiClient.get<Deal>(`/deals/${id}`),
//   create: (data: Partial<Deal>) => apiClient.post<Deal>('/deals', data),
// };
