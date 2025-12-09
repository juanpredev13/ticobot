/**
 * React Query hooks for Health & Diagnostics API
 */

import { useQuery } from '@tanstack/react-query';
import { healthService } from '../api/services';
import { healthKeys } from './query-keys';

/**
 * Hook for health check
 */
export function useHealth(refetchInterval?: number) {
  return useQuery({
    queryKey: healthKeys.check(),
    queryFn: () => healthService.check(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: refetchInterval || false,
    retry: 2, // Retry twice for health checks
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
    retry: 1, // Retry once on failure
  });
}
