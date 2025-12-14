/**
 * React Query hooks for Compare API
 */

import { useMutation } from '@tanstack/react-query';
import { compareService } from '../api/services';
import type { CompareProposalsParams, CompareProposalsResponse } from '../api/services/compare';

/**
 * Hook to compare proposals between parties
 */
export function useCompareProposals() {
  return useMutation<CompareProposalsResponse, Error, CompareProposalsParams>({
    mutationFn: (params) => compareService.compare(params),
  });
}



