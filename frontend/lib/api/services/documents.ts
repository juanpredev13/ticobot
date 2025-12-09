/**
 * Documents API Service
 * Handles all document-related API calls
 */

import { api } from '../client';
import type {
  DocumentListResponse,
  DocumentDetailResponse,
  DocumentListRequest,
} from '../types';

export const documentsService = {
  /**
   * Get list of all documents with optional pagination and filters
   */
  list: async (params?: DocumentListRequest): Promise<DocumentListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.party) queryParams.append('party', params.party);

    const endpoint = `/api/documents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<DocumentListResponse>(endpoint);
  },

  /**
   * Get document by ID
   */
  getById: async (id: string): Promise<DocumentDetailResponse> => {
    return api.get<DocumentDetailResponse>(`/api/documents/${id}`);
  },

  /**
   * Get chunks for a specific document
   */
  getChunks: async (id: string): Promise<{ chunks: any[] }> => {
    return api.get(`/api/documents/${id}/chunks`);
  },
};
