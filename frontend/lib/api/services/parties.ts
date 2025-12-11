/**
 * Parties API Service
 * Handles all party-related API calls
 */

import { api } from '../client';

/**
 * Party type matching backend response
 */
export interface Party {
  id: string;
  name: string;
  abbreviation: string | null;
  slug: string;
  founded_year: number | null;
  ideology: string[] | null;
  colors: {
    primary: string;
    secondary: string;
  };
  logo_url: string | null;
  description: string | null;
  website: string | null;
  social_media: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  } | null;
  current_representation: {
    deputies: number;
    mayors: number;
  } | null;
  created_at: string;
  updated_at: string;
}

/**
 * Candidate type matching backend response
 */
export interface Candidate {
  id: string;
  party_id: string;
  name: string;
  slug: string;
  position: string;
  photo_url: string | null;
  birth_date: string | null;
  birth_place: string | null;
  education: string[] | null;
  professional_experience: string[] | null;
  political_experience: string[] | null;
  biography: string | null;
  proposals: {
    topic: string;
    description: string;
  }[] | null;
  social_media: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface PartiesListResponse {
  parties: Party[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PartyDetailResponse {
  party: Party;
}

export interface PartyCandidatesResponse {
  party: Party;
  candidates: Candidate[];
}

export interface ListPartiesParams {
  limit?: number;
  offset?: number;
}

export const partiesService = {
  /**
   * Get list of all parties with optional pagination
   */
  list: async (params?: ListPartiesParams): Promise<PartiesListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const endpoint = `/api/parties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<PartiesListResponse>(endpoint);
  },

  /**
   * Get party by ID
   */
  getById: async (id: string): Promise<PartyDetailResponse> => {
    return api.get<PartyDetailResponse>(`/api/parties/${id}`);
  },

  /**
   * Get party by slug
   */
  getBySlug: async (slug: string): Promise<PartyDetailResponse> => {
    return api.get<PartyDetailResponse>(`/api/parties/slug/${slug}`);
  },

  /**
   * Get candidates for a specific party
   */
  getCandidates: async (partyId: string): Promise<PartyCandidatesResponse> => {
    return api.get<PartyCandidatesResponse>(`/api/parties/${partyId}/candidates`);
  },
};

