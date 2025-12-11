/**
 * React Query hooks for Candidates API
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { candidatesService } from '../api/services';
import { candidateKeys } from './query-keys';
import type { ListCandidatesParams } from '../api/services/candidates';

/**
 * Hook to fetch list of candidates
 */
export function useCandidates(params?: ListCandidatesParams) {
  return useQuery({
    queryKey: candidateKeys.list(params),
    queryFn: () => candidatesService.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch a single candidate by ID
 */
export function useCandidate(id: string, enabled = true) {
  return useQuery({
    queryKey: candidateKeys.detail(id),
    queryFn: () => candidatesService.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch a single candidate by slug
 */
export function useCandidateBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: candidateKeys.bySlug(slug),
    queryFn: () => candidatesService.getBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to prefetch a candidate (useful for hover states)
 */
export function usePrefetchCandidate() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: candidateKeys.detail(id),
      queryFn: () => candidatesService.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to prefetch a candidate by slug
 */
export function usePrefetchCandidateBySlug() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: candidateKeys.bySlug(slug),
      queryFn: () => candidatesService.getBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };
}

