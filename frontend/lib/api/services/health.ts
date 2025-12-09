/**
 * Health & Diagnostics API Service
 * Handles health checks and system diagnostics
 */

import { api } from '../client';
import type { HealthResponse, DiagnosticsResponse } from '../types';

export const healthService = {
  /**
   * Check API health status
   */
  check: async (): Promise<HealthResponse> => {
    return api.get<HealthResponse>('/health');
  },

  /**
   * Get detailed system diagnostics
   */
  diagnostics: async (): Promise<DiagnosticsResponse> => {
    return api.get<DiagnosticsResponse>('/api/diagnostics');
  },
};
