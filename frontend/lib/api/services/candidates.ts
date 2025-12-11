/**
 * Candidates API Service
 * Handles all candidate-related API calls
 */

import { api } from '../client';
import type { Candidate, Party } from './parties';

export interface CandidatesListResponse {
  candidates: Candidate[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CandidateDetailResponse {
  candidate: Candidate;
  party: Party | null;
}

export interface ListCandidatesParams {
  limit?: number;
  offset?: number;
  party_id?: string;
  position?: string;
}

export const candidatesService = {
  /**
   * Get list of all candidates with optional filters and pagination
   */
  list: async (params?: ListCandidatesParams): Promise<CandidatesListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.party_id) queryParams.append('party_id', params.party_id);
    if (params?.position) queryParams.append('position', params.position);

    const endpoint = `/api/candidates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<CandidatesListResponse>(endpoint);
  },

  /**
   * Get candidate by ID
   */
  getById: async (id: string): Promise<CandidateDetailResponse> => {
    return api.get<CandidateDetailResponse>(`/api/candidates/${id}`);
  },

  /**
   * Get candidate by slug
   */
  getBySlug: async (slug: string): Promise<CandidateDetailResponse> => {
    return api.get<CandidateDetailResponse>(`/api/candidates/slug/${slug}`);
  },
};

