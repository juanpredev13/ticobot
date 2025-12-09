/**
 * React Query hooks for Health & Diagnostics API
 */

import { useQuery } from '@tanstack/react-query';
import { healthService } from '../api/services';

// Query keys
export const healthKeys = {
  all: ['health'] as const,
  check: () => [...healthKeys.all, 'check'] as const,
  diagnostics: () => [...healthKeys.all, 'diagnostics'] as const,
};

/**
 * Hook for health check
 */
export function useHealth(refetchInterval?: number) {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: () => healthService.check(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: refetchInterval || false,
  });
}

/**
 * Hook for system diagnostics
 */
export function useDiagnostics() {
  return useQuery({
    queryKey: healthKeys.diagnostics(),
    queryFn: () => healthService.diagnostics(),
    staleTime: 60 * 1000, // 1 minute
  });
}
