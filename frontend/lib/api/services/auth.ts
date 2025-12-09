/**
 * Authentication API Service
 * Handles user authentication and authorization
 */

import { api } from '../client';
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  AuthRefreshRequest,
  AuthTokenResponse,
  UserProfile,
} from '../types';

export const authService = {
  /**
   * Register a new user
   */
  register: async (request: AuthRegisterRequest): Promise<AuthTokenResponse> => {
    return api.post<AuthTokenResponse>('/api/auth/register', request);
  },

  /**
   * Login with email and password
   */
  login: async (request: AuthLoginRequest): Promise<AuthTokenResponse> => {
    return api.post<AuthTokenResponse>('/api/auth/login', request);
  },

  /**
   * Refresh access token
   */
  refresh: async (request: AuthRefreshRequest): Promise<AuthTokenResponse> => {
    return api.post<AuthTokenResponse>('/api/auth/refresh', request);
  },

  /**
   * Logout (invalidate tokens)
   */
  logout: async (): Promise<{ success: boolean }> => {
    return api.post('/api/auth/logout');
  },

  /**
   * Get current user profile
   */
  me: async (): Promise<UserProfile> => {
    return api.get<UserProfile>('/api/auth/me');
  },
};
