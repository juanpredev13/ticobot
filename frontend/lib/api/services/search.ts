/**
 * Search API Service
 * Handles semantic search operations
 */

import { api } from '../client';
import type { SearchRequest, SearchResponse } from '../types';

export const searchService = {
  /**
   * Perform semantic search
   */
  search: async (request: SearchRequest): Promise<SearchResponse> => {
    return api.post<SearchResponse>('/api/search', request);
  },

  /**
   * Perform search via GET (for simple queries)
   */
  searchGet: async (query: string, topK?: number): Promise<SearchResponse> => {
    const queryParams = new URLSearchParams({ q: query });
    if (topK) queryParams.append('topK', topK.toString());

    return api.get<SearchResponse>(`/api/search?${queryParams.toString()}`);
  },
};
