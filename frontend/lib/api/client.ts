/**
 * API Client Configuration
 * Provides base fetch wrapper with retry logic, error handling, and request interceptors
 */

// API Configuration from environment variables
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
} as const;

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Request configuration type
export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: number;
  retryDelay?: number;
}

/**
 * Delay helper for retry logic
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get formatted timestamp for logging
 */
const getTimestamp = (): string => {
  const now = new Date();
  return now.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (status: number): boolean => {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
};

/**
 * Main API client with retry logic and error handling
 */
export async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const {
    timeout = API_CONFIG.timeout,
    retry = 1,
    retryDelay = 1000,
    ...fetchConfig
  } = config;

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.baseURL}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error | null = null;
  let attempts = 0;

  // Log request
  const method = (config.method || 'GET').toUpperCase();
  console.log(`[${getTimestamp()}] → ${method} ${endpoint}`);

  while (attempts <= retry) {
    try {
      // Get access token from localStorage if available
      const accessToken = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...fetchConfig.headers,
        },
      });

      clearTimeout(timeoutId);

      // Log response
      console.log(`[${getTimestamp()}] ← ${response.status} ${endpoint}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new APIError(
          errorData.message || response.statusText,
          response.status,
          errorData
        );

        // Retry on retryable errors
        if (attempts < retry && isRetryableError(response.status)) {
          attempts++;
          await delay(retryDelay * attempts);
          continue;
        }

        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }

      return (await response.text()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError('Request timeout', 408);
      }

      // Network errors
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempts < retry) {
        attempts++;
        await delay(retryDelay * attempts);
        continue;
      }

      throw new APIError(
        lastError?.message || 'Network error',
        0,
        lastError
      );
    }
  }

  throw lastError || new APIError('Unknown error', 0);
}

/**
 * Convenience methods for different HTTP verbs
 */
export const api = {
  get: <T>(endpoint: string, config?: RequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, config?: RequestConfig) =>
    apiClient<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, config?: RequestConfig) =>
    apiClient<T>(endpoint, { ...config, method: 'DELETE' }),
};
