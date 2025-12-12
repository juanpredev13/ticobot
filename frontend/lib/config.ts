/**
 * Frontend Configuration
 * Centralized configuration from environment variables
 */

// Validate required environment variables
function getRequiredEnv(key: string, fallback?: string): string {
  const value = process.env[key];

  if (!value && !fallback) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    console.warn(`Missing environment variable: ${key}`);
  }

  return value || fallback || '';
}

// API Configuration
export const API_URL = getRequiredEnv(
  'NEXT_PUBLIC_API_URL',
  'http://localhost:3001'
);

export const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
  10
);

// Development Configuration
export const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');

export const ENABLE_QUERY_DEVTOOLS =
  process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS === 'true' || IS_DEVELOPMENT;

// Export all config as a const object
export const config = {
  api: {
    url: API_URL,
    timeout: API_TIMEOUT,
  },
  development: {
    isDevelopment: IS_DEVELOPMENT,
    enableQueryDevtools: ENABLE_QUERY_DEVTOOLS,
  },
} as const;
