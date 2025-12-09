/**
 * React Query hooks for Search API
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { searchService } from '../api/services';
import { searchKeys } from './query-keys';
import { toast } from '../toast';
import { APIError } from '../api/client';
import type { SearchRequest } from '../api/types';

/**
 * Hook for semantic search
 */
export function useSearch(request: SearchRequest, enabled = true) {
  return useQuery({
    queryKey: searchKeys.search(request),
    queryFn: () => searchService.search(request),
    enabled: enabled && !!request.query,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}

/**
 * Hook for search mutation (POST)
 */
export function useSearchMutation() {
  return useMutation({
    mutationFn: (request: SearchRequest) => searchService.search(request),
    retry: (failureCount, error) => {
      // Don't retry on validation errors (4xx)
      if (error instanceof APIError && error.statusCode < 500) {
        return false;
      }
      // Retry once on server errors (5xx)
      return failureCount < 1;
    },
    onError: (error) => {
      let message = 'Error al buscar. Por favor, intenta de nuevo.';

      if (error instanceof APIError) {
        if (error.statusCode === 401) {
          message = 'Debes iniciar sesión para buscar.';
        } else if (error.statusCode === 429) {
          message = 'Demasiadas búsquedas. Por favor, espera un momento.';
        } else {
          message = error.message;
        }
      }

      toast.error(message);
    },
  });
}

/**
 * Hook for simple GET search
 */
export function useSimpleSearch(query: string, topK?: number, enabled = true) {
  return useQuery({
    queryKey: searchKeys.simple(query, topK), // ✅ Fixed: Now uses centralized keys
    queryFn: () => searchService.searchGet(query, topK),
    enabled: enabled && !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 1,
  });
}
