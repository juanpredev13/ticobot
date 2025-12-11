/**
 * React Query hooks for Parties API
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partiesService } from '../api/services';
import { partyKeys } from './query-keys';
import type { ListPartiesParams } from '../api/services/parties';

/**
 * Hook to fetch list of parties
 */
export function useParties(params?: ListPartiesParams) {
  return useQuery({
    queryKey: partyKeys.list(params),
    queryFn: () => partiesService.list(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch a single party by ID
 */
export function useParty(id: string, enabled = true) {
  return useQuery({
    queryKey: partyKeys.detail(id),
    queryFn: () => partiesService.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch a single party by slug
 */
export function usePartyBySlug(slug: string, enabled = true) {
  return useQuery({
    queryKey: partyKeys.bySlug(slug),
    queryFn: () => partiesService.getBySlug(slug),
    enabled: enabled && !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch candidates for a specific party
 */
export function usePartyCandidates(partyId: string, enabled = true) {
  return useQuery({
    queryKey: partyKeys.candidates(partyId),
    queryFn: () => partiesService.getCandidates(partyId),
    enabled: enabled && !!partyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

/**
 * Hook to prefetch a party (useful for hover states)
 */
export function usePrefetchParty() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: partyKeys.detail(id),
      queryFn: () => partiesService.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Hook to prefetch a party by slug
 */
export function usePrefetchPartyBySlug() {
  const queryClient = useQueryClient();

  return (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: partyKeys.bySlug(slug),
      queryFn: () => partiesService.getBySlug(slug),
      staleTime: 10 * 60 * 1000,
    });
  };
}

