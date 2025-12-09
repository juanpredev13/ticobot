/**
 * React Query hooks for Documents API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../api/services';
import type { DocumentListRequest } from '../api/types';

// Query keys for cache management
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (params?: DocumentListRequest) => [...documentKeys.lists(), params] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  chunks: (id: string) => [...documentKeys.detail(id), 'chunks'] as const,
};

/**
 * Hook to fetch list of documents
 */
export function useDocuments(params?: DocumentListRequest) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single document by ID
 */
export function useDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentsService.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch chunks for a document
 */
export function useDocumentChunks(id: string, enabled = true) {
  return useQuery({
    queryKey: documentKeys.chunks(id),
    queryFn: () => documentsService.getChunks(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to prefetch a document (useful for hover states)
 */
export function usePrefetchDocument() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: documentKeys.detail(id),
      queryFn: () => documentsService.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}
