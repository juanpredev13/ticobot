/**
 * React Query hooks for Search API
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { searchService } from '../api/services';
import type { SearchRequest } from '../api/types';

// Query keys for cache management
export const searchKeys = {
  all: ['search'] as const,
  searches: () => [...searchKeys.all, 'searches'] as const,
  search: (request: SearchRequest) => [...searchKeys.searches(), request] as const,
};

/**
 * Hook for semantic search
 */
export function useSearch(request: SearchRequest, enabled = true) {
  return useQuery({
    queryKey: searchKeys.search(request),
    queryFn: () => searchService.search(request),
    enabled: enabled && !!request.query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook for search mutation (POST)
 */
export function useSearchMutation() {
  return useMutation({
    mutationFn: (request: SearchRequest) => searchService.search(request),
  });
}

/**
 * Hook for simple GET search
 */
export function useSimpleSearch(query: string, topK?: number, enabled = true) {
  return useQuery({
    queryKey: ['search', 'simple', query, topK],
    queryFn: () => searchService.searchGet(query, topK),
    enabled: enabled && !!query,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
