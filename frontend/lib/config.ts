/**
 * API Configuration
 * Reads the FastAPI backend URL from environment variables.
 * In a future phase this will connect to a live FastAPI REST API.
 */

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
} as const;

export type Config = typeof config;
