/**
 * React Query hooks for Documents API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsService } from '../api/services';
import { documentKeys } from './query-keys';
import { toast } from '../toast';
import { APIError } from '../api/client';
import type { DocumentListRequest } from '../api/types';

/**
 * Hook to fetch list of documents
 */
export function useDocuments(params?: DocumentListRequest) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => documentsService.list(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Retry once on failure
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
    retry: 1, // Retry once on failure
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
    retry: 1, // Retry once on failure
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
